# email_service.py


from django.conf import settings

import requests


BREVO_URL = 'https://api.brevo.com/v3/smtp/email'


def send_email(to_email, to_name, subject, html_content):
    payload = {
        'sender' : {
            'name' : settings.BREVO_FROM_NAME,
            'email' : settings.BREVO_FROM_EMAIL,
        },
        'to' : [
            {
                'email' : to_email,
                'name' : to_name or 'User'
            }
        ],
        'subject' : subject,
        'htmlContent' : html_content
    }

    headers = {
        'accept' : 'application/json',
        'api-key' : settings.BREVO_API_KEY,
        'content-type' : 'application/json'
    }

    print(settings.BREVO_API_KEY)

    response = requests.post(BREVO_URL, json = payload, headers = headers, timeout = 10)

    response.raise_for_status()

    return response.json()
