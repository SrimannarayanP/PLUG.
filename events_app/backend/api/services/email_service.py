# email_service.py


from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

import logging


# BREVO_URL = 'https://api.brevo.com/v3/smtp/email'


logger = logging.getLogger(__name__)


def send_email(to_email, to_name, subject, html_content, attachment = None):
    try:
        text_content = strip_tags(html_content)

        to_address = f"{to_name} <{to_email}>" if to_name else to_email

        email = EmailMultiAlternatives(
            subject = subject,
            body = text_content,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to = [to_address],
            reply_to = ['support@pluglive.in']
        )

        email.attach_alternative(html_content, 'text/html')

        if attachment:
            email.attach(*attachment)

        email.send(fail_silently = False)

        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")

        raise e # Explicitly re-raise the exception for Celery to trigger the retry.
