# utils.py


from django.conf import settings
from django.utils import timezone

import jwt, qrcode, io, base64

# Generates a secure, signed JWT containing the registration details. This token is the ticket.
def generate_ticket_token(registration_id, event_id):
    payload = {
        'rid' : registration_id, # Registration ID
        'eid' : event_id, # Event ID
        'iat' : timezone.now() # Issued At
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
    qr.add_data(data)
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
