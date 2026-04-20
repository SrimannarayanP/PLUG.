# auth_service.py


from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from api.tasks import send_password_reset_email, send_verification_email
from api.utils import generate_otp

import logging


User = get_user_model()

logger = logging.getLogger(__name__)


class AuthService:

    @staticmethod
    def request_password_reset(email):
        user = User.objects.filter(email__iexact = email.strip()).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://localhost:5173')
            reset_link = f'{frontend_url}/set-password/{uid}/{token}'

            transaction.on_commit(lambda: send_password_reset_email.delay(user.email, reset_link))

        return True
    
    @staticmethod
    def set_new_password(uid_b64, token, new_password):
        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk = uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):

            raise ValueError("Invalid user link.")
        
        if not default_token_generator.check_token(user, token):

            raise ValueError("Link has expired or is invalid.")
        
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            
            raise ValueError(" ".join(e.messages))
        
        user.set_password(new_password)
        user.save(update_fields = ['password'])
        
        return user
    
    @staticmethod
    def verify_email_otp(user, otp_input):
        if user.is_email_verified:

            return "Email is already verified."
        
        if user.otp != str(otp_input).strip():

            raise ValueError("Invalid OTP. Please check your email.")
        
        if not user.otp_created_at or timezone.now() > user.otp_created_at + timedelta(minutes = 10):

            raise ValueError("OTP has expired. Please request a new one.")
        
        user.is_email_verified = True
        user.otp = None
        user.otp_created_at = None
        user.save(update_fields = ['is_email_verified', 'otp', 'otp_created_at'])

        return "Email verified successfully!"
    
    @staticmethod
    def resend_otp(user):
        if user.is_email_verified:

            return "Email is already verified."
        
        if user.otp_created_at and timezone.now() < user.otp_created_at + timedelta(minutes = 1):
            wait_time = int(60 - (timezone.now() - user.otp_created_at).total_seconds())

            raise ValueError(f"RATE LIMIT: Please wait {wait_time} seconds before resending.")
        
        new_otp = generate_otp()
        user.otp = new_otp
        user.otp_created_at = timezone.now()
        user.save(update_fields = ['otp', 'otp_created_at'])

        transaction.on_commit(lambda: send_verification_email.delay(str(user.id), new_otp))

        return "New verification code sent."
