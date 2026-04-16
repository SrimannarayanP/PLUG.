# tasks.py


from celery import shared_task

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from .email_service import send_email
from .models import Registration
from .utils import generate_qr_bytes, generate_ticket_token

import cloudinary.uploader, io, logging, razorpay

logger = logging.getLogger(__name__)

User = get_user_model()

razorpay_client = razorpay.Client(auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@shared_task(bind = True)
def send_ticket_email(self, registration_id):
    # Async task to generate QR code & send email
    try:
        registration = Registration.objects.get(id = registration_id)
        event = registration.event
        user = registration.student.user

        token = generate_ticket_token(registration.id, event.id, event.end_date) # Generate token
        qr_bytes = generate_qr_bytes(token) # Get raw bytes

        qr_file = io.BytesIO(qr_bytes)

        upload_result = cloudinary.uploader.upload(
            qr_file,
            folder = 'plug_ticket_qrs',
            public_id = str(registration.id),
            format = 'png',
            overwrite = True,
        )

        qr_url = upload_result.get('secure_url')

        if event.location_type == 'online':
            location_display = "Online Event"
        else:
            location_display = event.physical_location or 'TBA'

        html_content = render_to_string(
            'emails/ticket_email.html',
            {
                'student_name' : user.first_name,
                'event_name' : event.name,
                'event_date' : event.start_date,
                'event_location' : location_display,
                'qr_image' : qr_url
            },
        )

        send_email(
            to_email = user.email,
            to_name = user.first_name,
            subject = f"Your ticket: {event.name}",
            html_content = html_content
        )

        return f"Email sent to {user.email}"
    except Registration.DoesNotExist:

        return f"Registration {registration_id} not found."
    
    except Exception as e:

        raise self.retry(exc = e, countdown = 10)
    
@shared_task(bind = True)
def send_password_reset_email(self, email, reset_link):
    try:
        html_content = render_to_string(
            'emails/password_reset.html',
            {'reset_link' : reset_link}
        )

        send_email(
            to_email = email,
            to_name = 'User',
            subject = "Reset your Password - PLUG.",
            html_content = html_content,
        )

        return f"Password reset email sent to {email}"
    except Exception as e:

        raise self.retry(exc = e, countdown = 10)


@shared_task(bind = True)
def send_verification_email(self, user_id, otp):
    try:
        user = User.objects.get(id = user_id)
        
        html_content = render_to_string(
            'emails/verify_email.html',
            {
                'first_name' : user.first_name,
                'otp' : otp,
            }
        )

        send_email(
            to_email = user.email,
            to_name = user.first_name,
            subject = "Verify your PLUG Account",
            html_content = html_content
        )

        return f"OTP sent to {user.email}"
    except User.DoesNotExist:

        return f"User {user_id} not found."
    
    except Exception as e:

        raise self.retry(exc = e, countdown = 10)


@shared_task
def release_abandoned_tickets():
    """Finds pending registrations older than 15 minutes & cancels them, releasing event capacity."""

    expiration_cutoff = timezone.now() - timedelta(minutes = 15)

    abandoned_tickets = Registration.objects.filter(payment_status = Registration.PaymentStatus.PENDING, is_cancelled = False, created_at__lt = expiration_cutoff)
    abandoned_ids = list(abandoned_tickets.values_list('id', flat = True))

    if not abandoned_ids:

        return "No abandoned tickets to release."

    released_count = abandoned_tickets.update(payment_status = Registration.PaymentStatus.REJECTED, is_cancelled = True)

    logger.info(f"Sweeper released {released_count} tickets. IDs : {abandoned_ids}")

    return f"Released {released_count} abandoned tickets."


@shared_task(bind = True, max_retries = 3)
def process_transaction_refund(self, razorpay_payment_id):
    """This is the worker task. This talks to Razorpay for exactly 1 specific, assigned ticket."""

    try:
        with transaction.atomic():
            pending_tickets = Registration.objects.select_for_update().filter(
                razorpay_payment_id = razorpay_payment_id,
                payment_status = Registration.PaymentStatus.REFUND_PENDING
            )

            if not pending_tickets.exists():

                return f"No pending tickets for payment {razorpay_payment_id}"
            
            total_refund_rupees = sum([t.event.ticket_price for t in pending_tickets])
            total_refund_paise = int(total_refund_rupees * 100)

            razorpay_client.payment.refund(razorpay_payment_id, {'amount' : total_refund_paise})

            # We won't marks as processed here. We'll do that using the webhook we defined in views.py.
            return f"Initiated refund of Rs. {total_refund_rupees} for payment {razorpay_payment_id} ({pending_tickets.count()} tickets)."
    except Exception as e:
        logger.error(f"Razorpay refund failed for registration {razorpay_payment_id} : {str(e)}")

        # If Razorpay throws a 502 or times out, retry after 60 seconds.
        raise self.retry(exc = e, countdown = 60)



@shared_task
def initiate_mass_refunds(event_id):
    """This is the master task. This will initialize 100s of independent 'worker' sub-tasks to handle refunds for all the tickets. No. of tickets = no. of 'worker'
    sub-tasks. It'll find all tickets owed a refund & spawns a worker for each. This is done to avoid getting rate-limited by Razorpay."""

    payment_ids = Registration.objects.filter(
        event_id = event_id,
        payment_status = Registration.PaymentStatus.REFUND_PENDING,
        is_cancelled = True,
        razorpay_payment_id__isnull = False
    ).values_list('razorpay_payment_id', flat = True).distinct()

    if not payment_ids:

        return f"No pending refunds found for event {event_id}"
    
    for pid in payment_ids:
        process_transaction_refund.delay(pid)

    return f"Queued {len(payment_ids)} individual refund tasks for event {event_id}"
