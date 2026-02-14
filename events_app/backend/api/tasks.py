# tasks.py


from celery import shared_task

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Registration
from .utils import generate_ticket_token, generate_qr_bytes


User = get_user_model()

@shared_task
def send_ticket_email(registration_id):
    # Async task to generate QR code & send email
    try:

        registration = Registration.objects.get(id = registration_id)
        event = registration.event
        user = registration.student.user

        token = generate_ticket_token(registration.id, registration.event.id) # Generate token
        qr_bytes = generate_qr_bytes(token) # Get raw bytes

        context = {
            'student_name' : user.first_name,
            'event_name' : event.name,
            'event_date' : event.start_date,
            'event_location' : event.location if hasattr(event, 'location') else None
        }

        # Construct email
        subject = f"Your Ticket: {event.name}"
        html_content = render_to_string('emails/ticket_email.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )

        msg.attach_alternative(html_content, 'text/html')

        # Attach QR code bytes
        msg.attach(f'ticket_{event.id}.png', qr_bytes, 'image/png')

        msg.send()

        return f"Email sent to {user.email}"
    
    except Registration.DoesNotExist:

        return f"Registration {registration_id} not found."
    
    except Exception as e:

        return f"Failed to send email: {str(e)}"
    
@shared_task
def send_password_reset_email(email, reset_link):
    subject = "Reset Your Password - PLUG."
    html_message = render_to_string('emails/password_reset.html', {'reset_link' : reset_link})
    plain_message = strip_tags(html_message)
    
    from_email = settings.DEFAULT_FROM_EMAIL
    to_email = [email]

    send_mail(
        subject,
        plain_message,
        from_email,
        to_email,
        html_message = html_message,
        fail_silently = False
    )


@shared_task
def send_verification_email(user_id, otp):
    try:
        user = User.objects.get(id = user_id)
        subject = "Verify your PLUG Account"

        context = {
            'first_name' : user.first_name,
            'otp' : otp
        }

        html_content = render_to_string('emails/verify_email.html', context)
        
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )

        msg.attach_alternative(html_content, 'text/html')
        msg.send()

        return f"OTP sent to {user.email}"
    except User.DoesNotExist:

        return f"User {user_id} not found."
    
    except Exception as e:

        return f"Failed to send OTP: {str(e)}"


@shared_task
def test_task():
    print("Celery is working!")

    return 'Done'
