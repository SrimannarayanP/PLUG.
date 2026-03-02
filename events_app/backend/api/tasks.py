# tasks.py


from celery import shared_task

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Registration
from .utils import generate_ticket_token, generate_qr_bytes
from .email_service import send_email

import cloudinary.uploader, io


User = get_user_model()

@shared_task(bind = True)
def send_ticket_email(self, registration_id):
    # Async task to generate QR code & send email
    try:
        registration = Registration.objects.get(id = registration_id)
        event = registration.event
        user = registration.student.user

        token = generate_ticket_token(registration.id, event.id) # Generate token
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

    released_count = Registration.objects.filter(
        payment_status = Registration.PaymentStatus.PENDING,
        is_cancelled = False,
        created_at__lt = expiration_cutoff
    ).update(
        payment_status = Registration.PaymentStatus.REJECTED,
        is_cancelled = True
    )

    if released_count > 0:
        
        return f"Released {released_count} abandoned tickets."
