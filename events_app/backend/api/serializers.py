# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

# We're only getting data that we want to send to the frontend

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from datetime import datetime

from .models import Category, CustomUser, Event, EventDocument, OrganisationProfile, Registration, SchoolCollege, StudentProfile
from .tasks import send_verification_email
from .utils import  generate_qr_code_base64, generate_ticket_token, generate_otp

User = get_user_model()


# Auth & Token Serializers
# This view is for getting the access & refresh tokens for login. It's custom because it uses email instead of username for verification.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Encoding the below data into the token
        token['role'] = user.role
        token['email'] = user.email

        return token

    def validate(self, attrs):
        credentials = {
            'email' : attrs.get('email'),
            'password' : attrs.get('password'),
        }

        if 'email' in attrs and 'password' in attrs:
            user = authenticate(**credentials)

            if user is None:    
                
                raise ValidationError("Invalid email or password")

        else:

            return super().validate(attrs)
        
        refresh = self.get_token(user)

        is_profile_complete = False

        if user.role == CustomUser.Role.HOST:
            if hasattr(user, 'organisation_profile'):
                profile = user.organisation_profile

                if profile.name and profile.phone_number:
                    is_profile_complete = True
        else:
            if hasattr(user, 'student_profile'):
                profile = user.student_profile

                if profile.phone_number:
                    is_profile_complete = True

        return {

            'refresh' : str(refresh),
            'access' : str(refresh.access_token),
            'user' : {
                'id' : user.id,
                'email' : user.email,
                'first_name' : user.first_name,
                'last_name' : user.last_name,
                'role' : user.role,
                'is_profile_complete' : is_profile_complete,
                'is_email_verified' : user.is_email_verified
            }

        }
    

class SetNewPasswordSerializer(serializers.Serializer):

    uid = serializers.CharField(write_only = True)
    token = serializers.CharField(write_only = True)
    password = serializers.CharField(write_only = True, style = {'input_type' : 'password'})

    def validate(self, attrs):
        # Decode the UID for this user.
        try:
            uid = force_str(urlsafe_base64_decode(attrs.get('uid')))

            self.user = User.objects.get(pk = uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):

            raise ValidationError({'uid' : "Invalid user link."})
        
        # Check if the token is valid for this user.
        if not default_token_generator.check_token(self.user, attrs.get('token')):

            raise ValidationError({'token' : "Link has expired or is invalid."})

        try:
            validate_password(attrs.get('password'), self.user)
        except Exception as e:

            raise ValidationError({'password' : list(e.messages)})
        
        return attrs

    # Set the new password & save
    def save(self):
        self.user.set_password(self.validated_data['password'])
        self.user.save()

        return self.user
 

# --- Lookup Serializers ---
class CategorySerializer(serializers.ModelSerializer):

    class Meta:

        model = Category
        fields = ['id', 'name']


class SchoolCollegeSerializer(serializers.ModelSerializer):

    class Meta:

        model = SchoolCollege
        fields = ['id', 'name', 'city', 'state']


# --- Profile Serializers ---
class OrganisationProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = OrganisationProfile
        fields = ['name' ,'phone_number']


class StudentProfileSerializer(serializers.ModelSerializer):

    school_college = SchoolCollegeSerializer(read_only = True)

    class Meta:
        
        model = StudentProfile
        fields = ['date_of_birth', 'phone_number', 'school_college', 'student_id_number'] # joined_organisation


class StudentOrgRelationSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source = 'user.username')

    class Meta:

        model = OrganisationProfile
        fields = ['id', 'username', 'name']


# --- User Serializer ---
class UserSerializer(serializers.ModelSerializer):

    # Optional fields during signup
    organisation_name = serializers.CharField(write_only = True, required = False)
    phone_number = serializers.CharField(write_only = True, required = False)
    date_of_birth = serializers.DateField(write_only = True, required = False)
    student_id_number = serializers.CharField(write_only = True, required = False)
    school_college_id = serializers.PrimaryKeyRelatedField(
        queryset = SchoolCollege.objects.all(),
        source = 'school_college',
        write_only = True,
        required = False,
        allow_null = True
    )
    profile = serializers.SerializerMethodField()

    class Meta:

        model = User
        fields = [
            'id', 'email', 'password', 'first_name', 'last_name', 'role', 'organisation_name', 'phone_number', 'date_of_birth', 'student_id_number', 'school_college_id', 
            'profile', 'is_email_verified'
        ]
        extra_kwargs = {
            'password' : {'write_only' : True}, # This ensures that when we're creating a new user, we accept a password but we don't want to return the
                                                # password when we return info. about the user
            'id' : {'read_only' : True}
        }

    # Really, what's happening here is that the serializer will look at this model, look at all the fields on that model & the ones we've defined, validate them & if the
    # data is valid, it'll pass it as validated_data in the function
    @transaction.atomic
    def create(self, validated_data):
        # Pop the profile data off from the dictionary.
        # We don't want to pass 'organisation_name' to the User model, it would crash   
        org_name = validated_data.pop('organisation_name', None) # Returns None if not provided
        phone_number = validated_data.pop('phone_number', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        student_id_number = validated_data.pop('student_id_number', None)
        school_college = validated_data.pop('school_college', None)
        role = validated_data.get('role', CustomUser.Role.STUDENT)

        user = User.objects.create_user(**validated_data)

        otp = generate_otp()

        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        if role == CustomUser.Role.HOST:
            OrganisationProfile.objects.create(
                user = user, 
                name = org_name, 
                phone_number = phone_number
            )
        else:
            # Default to student
            StudentProfile.objects.create(user = user, phone_number = phone_number, date_of_birth = date_of_birth, student_id_number = student_id_number, school_college = school_college)

        # We use on_commit to ensure the user exists in DB before Celery tries to find them.
        transaction.on_commit(lambda otp = otp: send_verification_email.delay(str(user.id), otp))

        return user
    
    # Checks who the user & gets the right data.
    def get_profile(self, obj):
        if hasattr(obj, 'organisation_profile'):

            return OrganisationProfileSerializer(obj.organisation_profile).data
        
        if hasattr(obj, 'student_profile'):

            return StudentProfileSerializer(obj.student_profile).data
        
        return None
    
    @transaction.atomic
    def update(self, instance, validated_data):

        phone_number = validated_data.pop('phone_number', None)
        org_name = validated_data.pop('organisation_name', None)
        school_college = validated_data.pop('school_college', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        
        # Updated standard user fields like first_name, last_name, etc.
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)

        instance.save()

        # Update host profile
        if hasattr(instance, 'organisation_profile'):
            profile = instance.organisation_profile

            if phone_number:
                profile.phone_number = phone_number

            if org_name: 
                profile.name = org_name

            profile.save()

        if hasattr(instance, 'student_profile'):
            profile = instance.student_profile

            if phone_number:
                profile.phone_number = phone_number

            if date_of_birth:
                profile.date_of_birth = date_of_birth

            if school_college:
                profile.school_college = school_college

            profile.save()

        return instance


# --- Event Serializers ---
class EventDocumentSerializer(serializers.ModelSerializer):

    class Meta:

        model = EventDocument
        fields = ['id', 'file', 'name', 'created_at']


class EventSerializer(serializers.ModelSerializer):

    # Read the list of nested objects 
    organisation = OrganisationProfileSerializer(read_only = True)
    categories = CategorySerializer(many = True, read_only = True)
    documents = EventDocumentSerializer(many = True, read_only = True)
    # Write list of IDs
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset = Category.objects.all(),
        many = True,
        write_only = True,
        source = 'categories'
    )
    uploaded_documents = serializers.ListField(
        child = serializers.FileField(
            max_length = 100000,
            allow_empty_file = False,
            use_url = False
        ),
        write_only = True,
        required = False
    )

    # Computed fields
    start_date_formatted = serializers.DateTimeField(source = 'start_date', format = r"%B %d, %Y, %I:%M %p", read_only = True)
    registration_deadline = serializers.DateTimeField(required = False, allow_null = True)

    is_registration_open = serializers.BooleanField(read_only = True)

    class Meta:

        model = Event
        fields = [
            'id', 'name', 'description', 'start_date', 'start_date_formatted', 'end_date', 'location_type', 'physical_location', 'google_maps_link',
            'virtual_location', 'register_link', 'registration_deadline', 'is_native', 'is_featured', 'poster', 'is_paid_event', 'payment_qr_image',
            'ticket_price', 'max_tickets_per_user', 'organisation', 'categories', 'category_ids', 'is_registration_open', 'age_restriction_cutoff', 'collect_phone',
            'collect_college_school', 'collect_student_id', 'documents', 'uploaded_documents'
        ]

    def validate(self, attrs):
        """Before creating/updating, we create a dummy instance & run .clean() on it to check if there's bad data in the request sent."""

        # Taking out fields that would crash the .clean() method.
        non_model_fields = ['uploaded_documents', 'categories', 'documents']
        model_attrs = {k: v for k, v in attrs.items() if k not in non_model_fields}

        # Temp. instance
        if self.instance:
            # To prevent dirtying the real self.instance
            temp_instance = Event(pk = self.instance.pk)

            for field in self.instance._meta.fields:
                setattr(temp_instance, field.name, getattr(self.instance, field.name))

            for key, value in model_attrs.items():
                setattr(temp_instance, key, value)
        else:
            temp_instance = Event(**model_attrs)

        try:
            temp_instance.clean()
        except ValidationError as e:

            raise serializers.ValidationError(e.message_dict)
        
        start_date = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = attrs.get('end_date') or (self.instance.end_date if self.instance else None)

        reg_deadline = attrs.get('registration_deadline')

        if not reg_deadline and start_date:
            attrs['registration_deadline'] = start_date
            reg_deadline = start_date

        if 'registration_deadline' not in attrs and self.instance:
            reg_deadline = self.instance.registration_deadline

        if start_date and end_date and start_date >= end_date:

            raise ValidationError({'end_date' : "End date must be after the start date."})
        
        if reg_deadline and start_date and reg_deadline > start_date:

            raise ValidationError({'registration_deadline' : "Registration deadline cannot be after the event starts."})

        return attrs

    def create(self, validated_data):
        documents_data = validated_data.pop('uploaded_documents', [])
        categories = validated_data.pop('categories', [])

        event = Event.objects.create(**validated_data)

        event.categories.set(categories)

        for file in documents_data[:5]:
            EventDocument.objects.create(event = event, file = file, name = file.name)

        return event
    
    def update(self, instance, validated_data):
        documents_data = validated_data.pop('uploaded_documents', [])
        categories = validated_data.pop('categories', None) # If no categories provided, don't update

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if categories is not None:
            instance.categories.set(categories)

        current_count = instance.documents.count()

        for file in documents_data:
            if current_count < 5:
                EventDocument.objects.create(event = instance, file = file, name = file.name)

                current_count += 1

        instance.save()

        return instance
    

# --- Ticket & Registration Serializers ---
class RegistrationSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only = True)
    qr_code = serializers.SerializerMethodField()

    attendee_name = serializers.CharField(read_only = True)
    email = serializers.EmailField(read_only = True)

    class Meta:

        model = Registration
        fields = ['id', 'event', 'attendee_name', 'email', 'created_at', 'is_checked_in', 'is_cancelled', 'qr_code', 'ticket_code', 'payment_status', 'transaction_id']

    def get_qr_code(self, obj):
        token = generate_ticket_token(str(obj.id), str(obj.event.id))

        return generate_qr_code_base64(token)
    

class TicketAttendeeSerializer(serializers.Serializer):

    first_name = serializers.CharField()
    last_name = serializers.CharField(allow_blank = True)
    email = serializers.EmailField()

    # Smart Fields
    phone_number = serializers.CharField(required = False, allow_blank = True)
    student_id_number = serializers.CharField(required = False, allow_blank = True)
    date_of_birth = serializers.DateField(required = False, allow_null = True)

    school_college_id = serializers.IntegerField(required = False, allow_null = True)
    school_college_name = serializers.CharField(required = False, allow_blank = True)
    school_college_city = serializers.CharField(required = False, allow_blank = True)
    school_college_state = serializers.CharField(required = False, allow_blank = True)


class BulkRegistrationSerializer(serializers.Serializer):

    event_id = serializers.UUIDField()
    transaction_id = serializers.CharField(required = False, allow_blank = True)

    attendees = TicketAttendeeSerializer(many = True, allow_empty = False)

    def validate(self, data):
        event_id = data.get('event_id')
        attendees = data.get('attendees')
        user = self.context['request'].user

        try:
            event = Event.objects.get(id = event_id)
        except Event.DoesNotExist:

            raise serializers.ValidationError({'event_id' : "Event not found."})
        
        if len(attendees) > event.max_tickets_per_user:

            raise serializers.ValidationError(f"You can only book a maximum of {event.max_tickets_per_user} tickets.")
        
        for index, attendee in enumerate(attendees):
            is_buyer = (index == 0)

            if not is_buyer:
                if not attendee.get('first_name'):

                    raise serializers.ValidationError({f"attendees[{index}].first_name" : "Guest's first name is required."})
                
                if not attendee.get('last_name'):

                    raise serializers.ValidationError({f"attendees[{index}].last_name" : "Guest's last name is required."})

            # Phone Check
            if event.collect_phone:
                phone_number = attendee.get('phone_number')

                if is_buyer:
                    # phone for guest, phone_number for buyer.
                    if not user.student_profile.phone_number and not phone_number:

                        raise serializers.ValidationError({f"attendees[{index}].phone_number" : "Phone number is required."})
                elif not phone_number:
                    
                    raise serializers.ValidationError({f"attendees[{index}].phone_number" : "Phone number is required."})
                
            # Student ID Check
            if event.collect_student_id:
                student_id_number = attendee.get('student_id_number')

                if is_buyer:
                    if not user.student_profile.student_id_number and not student_id_number:

                        raise serializers.ValidationError({f"attendees[{index}].student_id_number" : "Student ID number is required."})
                elif not student_id_number:
                    
                    raise serializers.ValidationError({f"attendees[{index}].student_id_number" : "Student ID number is required."})
                    
            # School/College Check
            if event.collect_college_school:
                if attendee.get('school_college_id'):
                    pass
                elif attendee.get('school_college_name'):
                    raw_name = attendee.get('school_college_name').strip()
                    raw_city = attendee.get('school_college_city').strip()
                    raw_state = attendee.get('school_college_state').strip()

                    if not raw_city or not raw_state:
                        
                        raise serializers.ValidationError({f"attendees[{index}].school_college" : "To add a new college, you MUST provide its City & State."})
                    
                    college_obj, created = SchoolCollege.objects.get_or_create(
                        name__iexact = raw_name,
                        city__iexact = raw_city,
                        defaults = {
                            'name' : raw_name.title(),
                            'city' : raw_city.title(),
                            'state' : raw_state.title()
                        }
                    )

                    # After inserting into DB, inject that ID into this data
                    attendee['school_college_id'] = college_obj.id
                elif is_buyer and user.student_profile.school_college:
                    pass
                else:
                    
                    raise serializers.ValidationError({f"attendees[{index}].school_college" : "School/College is required."})
                
            # Age Check
            if event.age_restriction_cutoff:
                dob = attendee.get('date_of_birth')

                if is_buyer and not dob:
                    dob = user.student_profile.date_of_birth

                if not dob:

                    raise serializers.ValidationError({f"attendees[{index}].date_of_birth" : "Date of Birth is required."})

                if dob > event.age_restriction_cutoff:
                    name = attendee.get('first_name', f"Attendee #{index + 1}")

                    raise serializers.ValidationError(f"Sorry, {name} does not meet the age requirement.")

        data['event'] = event

        return data


# Serializer for hosts to view list of attendees.
class AttendeeListSerializer(serializers.ModelSerializer):

    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.SerializerMethodField()
    school_college = serializers.SerializerMethodField()
    student_id_number = serializers.SerializerMethodField()

    class Meta:

        model = Registration
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number', 'school_college', 'student_id_number', 'is_checked_in', 'created_at', 'payment_status', 
            'transaction_id'
        ]

    def get_phone_number(self, obj):
        
        return obj.guest_data.get('phone_number') or obj.student.phone_number or 'N/A'
    
    def get_school_college(Self, obj):

        return obj.guest_data.get('school_college_name') or (str(obj.student.school_college) if obj.student.school_college else 'N/A')
    
    def get_student_id_number(self, obj):

        return obj.guest_data.get('student_id_number') or obj.student.student_id_number or 'N/A'
