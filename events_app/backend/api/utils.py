# utils.py


from datetime import timedelta

from django.conf import settings
from django.db.models import F
from django.utils import timezone

import base64, io, jwt, qrcode, random, string


# Generates a secure, signed JWT containing the registration details. This token is the ticket.
def generate_ticket_token(registration_id, event_id, event_end_date):
    expiration_date = event_end_date + timedelta(hours = 12)

    payload = {
        'rid' : str(registration_id), # Registration ID
        'eid' : str(event_id), # Event ID
        'iat' : timezone.now(), # Issued At
        'exp' : expiration_date # Expiration date
    }

    # Sign the token using HS256 algorithm & my secret key
    return jwt.encode(payload, settings.TICKET_SIGNING_KEY, algorithm = 'HS256')


# Generates the PIL (Pillow) image object. Encapsulates all the data & the metadata associated with an image.
def _generate_qr_core(data):
    qr = qrcode.QRCode(
        version = 1,
        error_correction = qrcode.constants.ERROR_CORRECT_L,
        box_size = 10,
        border = 4,
    )
    qr.add_data(str(data))
    qr.make(fit = True)

    return qr.make_image(fill_color = 'black', back_color = 'white')


# Returns raw bytes for email attachments
def generate_qr_bytes(data):
    img = _generate_qr_core(data)
    buffer = io.BytesIO()
    img.save(buffer, format = 'PNG')

    return buffer.getvalue()


# Generates QR code & returns it as Base64 string. This way we can directly send this string as a JSON object instead of saving the QR image
def generate_qr_code_base64(data):
    qr_bytes = generate_qr_bytes(data) # Re-using bytes function to avoid duplicating IO logic
    img_str = base64.b64encode(qr_bytes).decode('utf-8')

    return f"data:image/png;base64,{img_str}"
    

# Random numeric string of fixed length
def generate_otp(length = 6):

    return ''.join(random.choices(string.digits, k = length))


def track_unlisted_school_college_request(name, campus, city, state):
    """Stores demand for an unlisted college in a shadow table. If it already exists, incremenet request_count."""

    if not name or not city or not state:

        return
    
    from .models import UnlistedSchoolCollege

    obj, created = UnlistedSchoolCollege.objects.get_or_create(
        name = name.strip(),
        campus = campus.strip() if campus else None,
        city = city.strip(),
        defaults = {'state' : state.strip(), 'request_count' : 1}
    )

    if not created:
        obj.request_count = F('request_count') + 1

        obj.save(update_fields = ['request_count'])
