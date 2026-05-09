# email_service.py


from django.conf import settings
from django.utils.html import strip_tags

import logging, resend


logger = logging.getLogger(__name__)

resend.api_key = getattr(settings, 'RESEND_API_KEY', None)


def send_email(to_email, to_name, subject, html_content, attachment = None):
    try:
        text_content = strip_tags(html_content)

        to_address = f"{to_name} <{to_email}>" if to_name else to_email
        from_address = getattr(settings, 'DEFAULT_FROM_EMAIL', "PLUG. <tickets@pluglive.in>")

        params = {
            'from' : from_address,
            'to' : [to_address],
            'subject' : subject,
            'html' : html_content,
            'text' : text_content,
            'reply_to' : 'support@pluglive.in'
        }

        if attachment:
            filename, content, _ = attachment

            if hasattr(content, 'read'):
                content = content.read()

            params['attachments'] = [
                {
                    'filename' : filename,
                    'content' : list(content)
                }
            ]

        resend.Emails.send(params)

        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via Resend: {str(e)}")

        raise e # Explicitly re-raise the exception for Celery to trigger the retry.
