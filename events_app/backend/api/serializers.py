# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

# We're only getting data that we want to send to the frontend

from django.contrib.auth import authenticate, get_user_model

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Category, CustomUser, Event, EventDocument, HostProfile, Registration, SchoolCollege, StudentProfile
from .utils import generate_qr_code_base64


User = get_user_model()


# --- Auth & Token Serializers ---
# This view is for getting the access & refresh tokens for login. It's custom because it uses email instead of username for verification.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Encoding the below data into the token
        token['is_admin'] = user.is_superuser
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

        if hasattr(user, 'student_profile'):
            if user.student_profile.phone_number:
                is_profile_complete = True

        manages_host = user.host_profiles.exists()

        return {

            'refresh' : str(refresh),
            'access' : str(refresh.access_token),
            'user' : {
                'id' : user.id,
                'email' : user.email,
                'first_name' : user.first_name,
                'last_name' : user.last_name,
                'is_profile_complete' : is_profile_complete,
                'manages_host' : manages_host,
                'is_email_verified' : user.is_email_verified
            }

        }
    

class SetNewPasswordSerializer(serializers.Serializer):

    uid = serializers.CharField(write_only = True)
    token = serializers.CharField(write_only = True)
    password = serializers.CharField(write_only = True, style = {'input_type' : 'password'})
 

# --- Lookup Serializers ---
class CategorySerializer(serializers.ModelSerializer):

    class Meta:

        model = Category
        fields = ['id', 'name']


class SchoolCollegeSerializer(serializers.ModelSerializer):

    class Meta:

        model = SchoolCollege
        fields = ['id', 'name', 'campus', 'city', 'state']


class TeamMemberSerializer(serializers.ModelSerializer):
    """Minimal serializer to show the users under a club"""

    class Meta:

        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name']

# --- Profile Serializers ---
class HostProfileSerializer(serializers.ModelSerializer):
    
    school_college = SchoolCollegeSerializer(read_only = True)

    owner = serializers.PrimaryKeyRelatedField(read_only = True)
    team_members = TeamMemberSerializer(source = 'users', many = True, read_only = True)

    class Meta:

        model = HostProfile
        fields = ['id', 'name', 'host_type', 'contact_email', 'school_college', 'is_verified', 'owner', 'team_members']


class StudentProfileSerializer(serializers.ModelSerializer):

    school_college = SchoolCollegeSerializer(read_only = True)

    class Meta:
        
        model = StudentProfile
        fields = ['date_of_birth', 'phone_number', 'school_college', 'student_id_number', 'unlisted_school_college_data']


# class StudentOrgRelationSerializer(serializers.ModelSerializer):

#     username = serializers.CharField(source = 'user.username')

#     class Meta:

#         model = OrganisationProfile
#         fields = ['id', 'username', 'name']


# --- User Serializer ---
class UserSerializer(serializers.ModelSerializer):

    # Optional fields during signup
    organisation_name = serializers.CharField(write_only = True, required = False, allow_blank = True)
    phone_number = serializers.CharField(write_only = True, required = False, allow_blank = True)
    date_of_birth = serializers.DateField(write_only = True, required = False, allow_null = True)
    student_id_number = serializers.CharField(write_only = True, required = False, allow_blank = True)

    register_as_host = serializers.BooleanField(write_only = True, default = False)
    host_type = serializers.ChoiceField(choices = HostProfile.HostType.choices, write_only = True, required = False)

    school_college_id = serializers.PrimaryKeyRelatedField(
        queryset = SchoolCollege.objects.all(),
        source = 'school_college',
        write_only = True,
        required = False,
        allow_null = True
    )
    unlisted_school_college_data = serializers.JSONField(write_only = True, required = False, allow_null = True)

    profile = serializers.SerializerMethodField()

    class Meta:

        model = User
        fields = [
            'id', 'email', 'password', 'first_name', 'last_name', 'register_as_host', 'organisation_name', 'phone_number', 'date_of_birth', 'student_id_number', 
            'school_college_id', 'unlisted_school_college_data', 'profile', 'is_email_verified', 'host_type'
        ]
        extra_kwargs = {
            'password' : {'write_only' : True}, # This ensures that when we're creating a new user, we accept a password but we don't want to return the
                                                # password when we return info. about the user
            'id' : {'read_only' : True}
        }
    
    # Checks who the user & gets the right data.
    def get_profile(self, obj):
        if obj.host_profiles.exists():

            return HostProfileSerializer(obj.host_profiles.first()).data
        
        if hasattr(obj, 'student_profile'):

            return StudentProfileSerializer(obj.student_profile).data
        
        return None


# --- Event Serializers ---
class EventDocumentSerializer(serializers.ModelSerializer):

    class Meta:

        model = EventDocument
        fields = ['id', 'file', 'name', 'created_at']


class EventSerializer(serializers.ModelSerializer):

    # Read the list of nested objects 
    host = HostProfileSerializer(read_only = True)
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
    is_internal_event = serializers.SerializerMethodField()

    has_pending_refunds = serializers.SerializerMethodField()

    restricted_to_school_college_ids = serializers.PrimaryKeyRelatedField(
        queryset = SchoolCollege.objects.all(),
        source = 'restricted_to_schools_colleges',
        required = False,
        allow_null = True,
        many = True
    )

    event_contacts = serializers.JSONField(required = False, allow_null = True)

    class Meta:

        model = Event
        fields = [
            'age_restriction_cutoff', 'capacity', 'categories', 'category_ids', 'collect_college_school', 'collect_student_id', 'description', 'documents', 'end_date',
            'event_contacts', 'google_maps_link', 'has_pending_refunds', 'host', 'id', 'is_cancelled', 'is_featured', 'is_internal_event', 'is_native', 'is_paid_event',
            'is_registration_open', 'is_sold_out', 'location_type', 'max_tickets_per_user', 'name', 'physical_location', 'poster', 'register_link',
            'registration_deadline', 'remaining_capacity', 'restricted_to_school_college_ids', 'start_date', 'start_date_formatted', 'ticket_price', 'uploaded_documents',
            'virtual_location'
        ]

    def get_is_internal_event(self, obj):

        return obj.restricted_to_schools_colleges.exists()

    def validate(self, attrs):
        """Before creating/updating, we create a dummy instance & run .clean() on it to check if there's bad data in the request sent."""

        # Taking out fields that would crash the .clean() method.
        non_model_fields = ['uploaded_documents', 'categories', 'documents', 'restricted_to_schools_colleges', 'event_contacts']
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
        
        if not temp_instance.is_native and not temp_instance.register_link:

            raise serializers.ValidationError({'register_link' : "External events must provide a valid registration link."})
        
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
    
    def get_has_pending_refunds(self, obj):
        if not obj.is_paid_event or not obj.is_cancelled:
            
            return False
        
        if hasattr(obj, '_prefetched_objects_cache') and 'registrations' in obj._prefetched_objects_cache:
            
            return any(reg.payment_status == Registration.PaymentStatus.REFUND_PENDING for reg in obj.registrations.all())
        
        return obj.registrations.filter(payment_status = Registration.PaymentStatus.REFUND_PENDING).exists()
    

# --- Ticket & Registration Serializers ---
class RegistrationSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only = True)
    qr_code = serializers.SerializerMethodField()

    attendee_name = serializers.CharField(read_only = True)
    email = serializers.EmailField(read_only = True)

    class Meta:

        model = Registration
        fields = [
            'id', 'event', 'attendee_name', 'email', 'created_at', 'is_checked_in', 'is_cancelled', 'qr_code', 'ticket_code', 'payment_status', 'razorpay_order_id',
            'razorpay_payment_id'
        ]

    def get_qr_code(self, obj):

        return generate_qr_code_base64(obj.ticket_code)
    

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
    school_college_campus = serializers.CharField(required = False, allow_blank = True)
    school_college_city = serializers.CharField(required = False, allow_blank = True)
    school_college_state = serializers.CharField(required = False, allow_blank = True)


class BulkRegistrationSerializer(serializers.Serializer):

    event_id = serializers.UUIDField()

    attendees = TicketAttendeeSerializer(many = True, allow_empty = False)

    def validate(self, data):
        attendees = data.get('attendees')
        attendee_emails = [a.get('email').strip().lower() for a in attendees if a.get('email')]

        if len(attendee_emails) != len(set(attendee_emails)):

            raise serializers.ValidationError("Duplicate emails found in your attendee list.")
        
        return data


# Serializer for hosts to view list of attendees.
class AttendeeListSerializer(serializers.ModelSerializer):

    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.SerializerMethodField()
    school_college = serializers.SerializerMethodField()
    student_id_number = serializers.SerializerMethodField()

    buyer_email = serializers.EmailField(source = 'student.user.email', read_only = True)
    buyer_first_name = serializers.CharField(source = 'student.user.first_name', read_only = True)
    buyer_last_name = serializers.CharField(source = 'student.user.last_name', read_only = True)

    class Meta:

        model = Registration
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number', 'school_college', 'student_id_number', 'is_checked_in', 'created_at', 'payment_status', 
            'razorpay_order_id', 'razorpay_payment_id', 'buyer_email', 'buyer_first_name', 'buyer_last_name'
        ]

    def get_phone_number(self, obj):
        
        return obj.guest_data.get('phone_number') or obj.student.phone_number or 'N/A'
    
    def get_school_college(Self, obj):
        guest_sc = obj.guest_data.get('school_college_name')

        if guest_sc:

            return guest_sc
        
        if obj.student.school_college:
            sc = obj.student.school_college

            return f"{sc.name} - {sc.campus} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"
        
        unlisted = obj.student.unlisted_school_college_data

        if unlisted and isinstance(unlisted, dict) and unlisted.get('name'):
            name = unlisted.get('name')
            campus = unlisted.get('campus')
            city = unlisted.get('city')

            return f"{name} - {campus} ({city}) [Unverified]" if campus else f"{name} ({city}) [Unverified]"
        
        return 'N/A'
    
    def get_student_id_number(self, obj):

        return obj.guest_data.get('student_id_number') or obj.student.student_id_number or 'N/A'
