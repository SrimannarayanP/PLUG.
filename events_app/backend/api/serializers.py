# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

# We're only getting data that we want to send to the frontend

from django.db import transaction
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Event, OrganisationProfile, Categories, Registrations, StudentProfile, SchoolCollege
from .utils import generate_ticket_token, generate_qr_code_base64

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
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        return token

    def validate(self, attrs):
        credentials = {
            'email' : attrs.get('email'),
            'password' : attrs.get('password'),
        }
        user = authenticate(**credentials)

        if user is None:

            raise serializers.ValidationError('Invalid email or password')
        
        refresh = self.get_token(user)

        return {
            'refresh' : str(refresh),
            'access' : str(refresh.access_token),
            'user' : {
                'id' : user.id,
                'email' : user.email,
                'username' : user.username,
                'first_name' : user.first_name,
                'last_name' : user.last_name,
                'role' : user.role,
            }
        }
    

class SetNewPasswordSerializer(serializers.Serializer):

    uid = serializers.CharField(write_only = True)
    token = serializers.CharField(write_only = True)
    password = serializers.CharField(
        write_only = True,
        style = {'input_type' : 'password'}
    )

    def validate(self, attrs):
        # Decode the UID for this user.
        try:
            uid = force_str(urlsafe_base64_decode(attrs.get('uid')))
            self.user = User.objects.get(pk = uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):

            raise serializers.ValidationError({'uid' : "Invalid user link."})
        
        # Check if the token is valid for this user.
        if not default_token_generator.check_token(self.user, attrs.get('token')):

            raise serializers.ValidationError({'token' : "Link has expired or is invalid."})

        try:
            validate_password(attrs.get('password'), self.user)
        except Exception as e:

            raise serializers.ValidationError({'password' : list(e.messages)})
        
        return attrs

    # Set the new password & save
    def save(self):
        self.user.set_password(self.validated_data['password'])
        self.user.save()

        return self.user
 

# Lookup serializers
class CategoriesSerializer(serializers.ModelSerializer):

    class Meta:

        model = Categories
        fields = ['id', 'name']


class SchoolCollegeSerializer(serializers.ModelSerializer):

    class Meta:

        model = SchoolCollege
        fields = ['id', 'name', 'city', 'state']


# Profile serializers
class StudentProfileSerializer(serializers.ModelSerializer):

    school_college = SchoolCollegeSerializer(read_only = True)

    school_college_id = serializers.PrimaryKeyRelatedField(
        queryset = SchoolCollege.objects.all(),
        source = 'college',
        write_only = True,
        required = False,
        allow_null = True
    )

    class Meta:
        
        model = StudentProfile
        fields = ['date_of_birth', 'phone_number', 'school_college', 'school_college_id', 'student_id_number']


class OrganisationProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = OrganisationProfile
        fields = ['name' ,'ph_no']


# User serializer
class UserSerializer(serializers.ModelSerializer):

    organisation_name = serializers.CharField(write_only = True, required = False)
    phone = serializers.CharField(write_only = True, required = False)

    class Meta:

        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'organisation_name', 'phone']
        extra_kwargs = {'password' : {'write_only' : True}} # This ensures that when we're creating a new user, we accept a password but we don't want to return the
                                                            # password when we return info. about the user

    # Really, what's happening here is that the serializer will look at this model, look at all the fields on that model & the ones we've defined, validate them & if the
    # data is valid, it'll pass it as validated_data in the function
    @transaction.atomic
    def create(self, validated_data):
        # Pop the profile data off from the dictionary.
        # We don't want to pass 'organisation_name' to the User model, it would crash   
        org_name = validated_data.pop('organisation_name', None)
        phone = validated_data.pop('phone', None)
        role = validated_data.get('role', 'student')

        user = User.objects.create_user(**validated_data)

        if role == 'host':
            if not org_name or not phone:

                raise serializers.ValidationError({'profile' : "Hosts must provide an Organisation Name & Phone Number."})
            
            OrganisationProfile.objects.create(
                user = user,
                name = org_name,
                ph_no = phone
            )
        elif role == 'student':
            # Create an empty student profile so they can register for events immediately. 
            StudentProfile.objects.create(
                user = user,
            )

        return user


class OrganisationSerializer(serializers.ModelSerializer):

    class Meta:

        model = OrganisationProfile
        fields = ['name', 'ph_no']


# Event serializer
class EventSerializer(serializers.ModelSerializer):

    # event_name = serializers.CharField()
    # location_type = serializers.CharField()
    # start_date = serializers.DateTimeField(
    #     format = r"%B %d, %Y, %I:%M %p"
    #     read_only = True
    # )
    # end_date = serializers.DateTimeField(format = r"%B %d, %Y, %I:%M %p")
    # location = serializers.SerializerMethodField()
    # organiser = serializers.CharField(source = 'organisation.name', read_only = True)
    # organisation = OrganisationProfileSerializer(read_only = True)
    # categories = CategoriesSerializer(
    #     many = True, 
    #     read_only = True
    # )
    # # File fields
    # payment_qr_image = serializers.ImageField(read_only = True) # Frontend needs to read it to display it.
    # poster_field = serializers.ImageField(max_length = None, use_url = True, required = False)
    # # Write list of IDs
    # category_ids = serializers.PrimaryKeyRelatedField(
    #     queryset = Categories.objects.all(),
    #     many = True,
    #     write_only = True,
    #     source = 'categories'
    # )

    # def get_location(self, obj):
    #     if obj.location_type == 'offline' and obj.physical_location:

    #         return obj.physical_location
    #     if obj.location_type == 'online':

    #         return obj.virtual_location or 'Online'
        
    #     return 'TBD'
    
    # def get_organisation(self, obj):

    #     return OrganisationSerializer(obj.organisation).data

    # class Meta:

    #     model = Event
    #     fields = '__all__'

    # Read the list of nested objects 
    organisation = OrganisationProfileSerializer(read_only = True)
    categories = CategoriesSerializer(
        many = True,
        read_only = True
    )

    # Write list of IDs
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset = Categories.objects.all(),
        many = True,
        write_only = True,
        source = 'categories'
    )

    start_date_formatted = serializers.DateTimeField(
        source = 'start_date', 
        format = r"%B %d, %Y, %I:%M %p", 
        read_only = True
    )

    is_registration_open = serializers.BooleanField(read_only = True)

    class Meta:

        model = Event
        fields = [
            'id', 'event_name', 'description', 'start_date', 'start_date_formatted', 'end_date', 'location_type', 'physical_location', 'google_maps_link',
            'virtual_location', 'register_link', 'registration_deadline', 'brochure', 'is_native', 'is_featured', 'poster_field', 'is_paid_event', 'payment_qr_image',
            'ticket_price', 'organisation', 'categories', 'category_ids', 'is_registration_open', 'age_restriction_cutoff', 'collect_phone', 'collect_college_school',
            'collect_student_id'
        ]


# Ticket & registration serializers
class TicketSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only = True)
    qr_code = serializers.SerializerMethodField()
    student = StudentProfileSerializer(read_only = True)

    class Meta:

        model = Registrations
        fields = ['id', 'event', 'student', 'date', 'checked_in', 'cancelled', 'qr_code', 'payment_status', 'transaction_id']

    def get_qr_code(self, obj):
        # Generate the secure token for this specific registration
        token = generate_ticket_token(obj.id, obj.event.id) 

        # Convert it to Base64 image string
        return generate_qr_code_base64(token)
