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
    
@shared_task
def send_password_reset_email_task(email, link):
    try:
        subject = "Action Required: Reset Your Password"
        from_email = settings.DEFAULT_FROM_EMAIL
        to = [email]

        html_content = f"""
            <html>
                <body style = "font-family : sans-serif; line-height : 1.6; color : #333;">
                    <div style = "max-width : 600px; margin : 0 auto; padding : 20px;">
                        <h2 style = "color : #000;">
                            Reset Your Password
                        </h2>

                        <p>We received a request to reset the password for your PLUG. account.</p>

                        <p>Click the button below to set a new password:</p>

                        <a 
                            href = "{link}"
                            style = "display : inline-block; padding : 12px 24px; background-color : #f97316; color : white; text-decoration : none; font-weight : bold; border-radius : 4px; margin : 20px 0;"
                        >
                            Reset Password
                        </a>

                        <p style = "font-size : 12px; color : #666;">
                            If you didn't ask for this, you can ignore this email.
                        </p>

                        <p style = "font-size : 12px; color : #999; margin-top : 30px;">
                            Button not working? Paste this link into your browser:<br>

                            {link}
                        </p>
                    </div>
                </body>
            </html>
        """

        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject,
            text_content,
            from_email,
            to
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send()

        return f"Password reset email sent to {email}"
    except Exception as e:

        return f"Failed to send password reset email: {str(e)}"
