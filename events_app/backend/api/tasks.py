# tasks.py



from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

from .models import Registrations
from .utils import generate_ticket_token, generate_qr_bytes


@shared_task
def send_ticket_email_task(registration_id):

    # Async task to generate QR code & send email
    try:

        registration = Registrations.objects.get(id = registration_id)

        token = generate_ticket_token(registration.id, registration.event.id) # Generate token
        qr_bytes = generate_qr_bytes(token) # Get raw bytes

        # Construct email
        subject = f"Your Ticket: {registration.event.event_name}"
        to_email = [registration.student.user.email]

        html_content = f"""
        <html>
            <body>
                <h1>You're going to {registration.event.event_name}!</h1>
                
                <p>Hi {registration.student.user.first_name},</p>
                <p>See attached QR code for your ticket.</p>
            </body>
        </html>
        """
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            to_email 
        )

        msg.attach_alternative(html_content, 'text/html')

        # Attach QR code bytes
        msg.attach('ticket_qr.png', qr_bytes, 'image/png')

        msg.send()

        return f"Email sent to {to_email}"
    
    except Registrations.DoesNotExist:

        return f"Registration {registration_id} not found."
    
    except Exception as e:

        return f"Failed to send email: {str(e)}"
