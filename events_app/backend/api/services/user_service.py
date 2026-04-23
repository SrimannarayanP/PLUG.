# user_service.py


from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from api.models import Event, StudentProfile, HostProfile, Registration
from api.tasks import send_verification_email
from api.utils import generate_otp, track_unlisted_school_college_request

import logging, uuid


User = get_user_model()

logger = logging.getLogger(__name__)


class UserService:

    @staticmethod
    @transaction.atomic
    def register_user(validated_data):
        organisation_name = validated_data.pop('organisation_name', None)
        phone_number = validated_data.pop('phone_number', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        student_id_number = validated_data.pop('student_id_number', None)
        school_college = validated_data.pop('school_college', None)
        unlisted_school_college_data = validated_data.pop('unlisted_school_college_data', None)
        register_as_host = validated_data.pop('register_as_host', False)
        host_type = validated_data.pop('host_type', HostProfile.HostType.CLUB)

        user = User.objects.create_user(**validated_data)

        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        StudentProfile.objects.create(
            user = user,
            phone_number = phone_number,
            date_of_birth = date_of_birth,
            student_id_number = student_id_number,
            school_college = school_college,
            unlisted_school_college_data = unlisted_school_college_data if not school_college else {}
        )

        if unlisted_school_college_data and not school_college:
            track_unlisted_school_college_request(
                name = unlisted_school_college_data.get('name'),
                campus = unlisted_school_college_data.get('campus'),
                city = unlisted_school_college_data.get('city'),
                state = unlisted_school_college_data.get('state')
            )

        if register_as_host and organisation_name:
            host_profile = HostProfile.objects.create(
                name = organisation_name,
                host_type = host_type,
                school_college = school_college,
                owner = user
            )

            host_profile.users.add(user)

        # Send email asynchronously after DB commits
        transaction.on_commit(lambda: send_verification_email.delay(str(user.id), otp))

        return user
    
    @staticmethod
    @transaction.atomic
    def update_profile(user, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        organisation_name = validated_data.pop('organisation_name', None)
        host_type = validated_data.pop('host_type', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        student_id_number = validated_data.pop('student_id_number', None)

        update_school_college = 'school_college' in validated_data
        school_college = validated_data.pop('school_college', None)
        unlisted_school_college_data = validated_data.pop('unlisted_school_college_data', None)

        for attr, value in validated_data.items():
            if attr == 'password':
                user.set_password(value)
            else:
                setattr(user, attr, value)

        user.save()

        if user.owned_clubs.exists():
            profile = user.owned_clubs.first()

            if organisation_name is not None:
                profile.name = organisation_name
            if host_type is not None:
                profile.host_type = host_type
            if update_school_college:
                profile.school_college = school_college

            profile.save()

        if hasattr(user, 'student_profile'):
            profile = user.student_profile

            if phone_number is not None:
                profile.phone_number = phone_number
            if date_of_birth is not None:
                profile.date_of_birth = date_of_birth
            if student_id_number is not None:
                profile.student_id_number = student_id_number

            if update_school_college:
                profile.school_college = school_college

                if school_college is not None:
                    profile.unlisted_school_college_data = {}
                elif unlisted_school_college_data:
                    profile.unlisted_school_college_data = unlisted_school_college_data

                    track_unlisted_school_college_request(
                        name = unlisted_school_college_data.get('name'),
                        campus = unlisted_school_college_data.get('campus'),
                        city = unlisted_school_college_data.get('city'),
                        state = unlisted_school_college_data.get('state')
                    )
            elif unlisted_school_college_data is not None:
                profile.unlisted_school_college_data = unlisted_school_college_data

                track_unlisted_school_college_request(
                    name = unlisted_school_college_data.get('name'),
                    campus = unlisted_school_college_data.get('campus'),
                    city = unlisted_school_college_data.get('city'),
                    state = unlisted_school_college_data.get('state')
                )

            profile.save()

        return user
    
    @staticmethod
    @transaction.atomic
    def delete_account(user):
        # Checks if the user owns any host profiles
        owned_hosts = user.owned_clubs.all()

        if owned_hosts.exists():
            active_events = Event.objects.filter(host__in = owned_hosts, start_date__gte = timezone.now(), is_cancelled = False).exists()

            if active_events:

                raise ValueError("You cannot delete your account while hosting active upcoming events. Cancel them 1st.")
            
            pending_finances = Registration.objects.filter(
                event__host__in = owned_hosts,
                payment_status__in = [Registration.PaymentStatus.REFUND_PENDING, Registration.PaymentStatus.PENDING]
            ).exists()

            if pending_finances:

                raise ValueError("You cannot delete your account with pending financial transactions. Process all refunds first.")

            for host in owned_hosts:
                host.name = f"Archived host {uuid.uuid4().hex[:8]}"

                host.save()

        active_tickets = Registration.objects.filter(student__user = user, event__start_date__gte = timezone.now(), is_cancelled = False).exists()

        if active_tickets:

            raise ValueError("You hold active tickets for upcoming events. You must cancel them before deleting your account.")
        
        dummy_hash = uuid.uuid4().hex[:16]

        user.email = f'deleted_{dummy_hash}@anonymized.local'
        user.first_name = 'Deleted'
        user.last_name = 'User'
        user.is_active = False
        user.set_unusable_password()
        user.save()

        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            profile.phone_number = None
            profile.student_id_number = None
            profile.date_of_birth = None

            profile.save()

        return True
