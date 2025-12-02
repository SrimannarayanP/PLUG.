# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

# We're only getting data that we want to send to the frontend

from django.db import transaction
from django.contrib.auth import get_user_model, authenticate
from django.forms import ValidationError

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Event, OrganisationProfile, Categories, Registrations, StudentProfile
from .utils import generate_ticket_token, generate_qr_code_base64

User = get_user_model()


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

            raise ValidationError('Invalid email or password')
        
        refresh = self.get_token(user)

        return {
            super().validate(attrs)
        }
 

class UserSerializer(serializers.ModelSerializer):

    organisation_name = serializers.CharField(write_only = True, required = False)
    phone_no = serializers.CharField(write_only = True, required = False)

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

                raise serializers.ValidationError({
                    'profile' : "Hosts must provide an Organisation Name & Phone Number."
                })
            
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


class EventSerializer(serializers.ModelSerializer):

    event_name = serializers.CharField()
    location_type = serializers.CharField()
    start_date = serializers.DateTimeField(format = r"%B %d, %Y, %I:%M %p")
    end_date = serializers.DateTimeField(format = r"%B %d, %Y, %I:%M %p")
    location = serializers.SerializerMethodField()
    categories = serializers.StringRelatedField(many = True)
    organiser = serializers.CharField(source = 'organisation.name', read_only = True)

    def get_location(self, obj):

        if obj.location_type == 'offline' and obj.physical_location:

            return obj.physical_location
        
        if obj.location_type == 'online':

            return obj.virtual_location or 'Online'
        
        return 'TBD'

    class Meta:

        model = Event
        fields = [
            'id', 'event_name', 'description', 'start_date', 'end_date', 'location_type', 'physical_location', 'virtual_location', 'register_link', 'is_native', 
            'is_featured', 'organisation', 'organiser', 'location', 'categories', 'poster_field', 'collect_phone', 'collect_college_school', 'collect_student_id'
        ]
        read_only_fields = ['organisation']
        

class CategoriesSerializer(serializers.ModelSerializer):

    class Meta:

        model = Categories
        fields = ['name']


class TicketSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only = True)
    qr_code = serializers.SerializerMethodField()

    class Meta:

        model = Registrations
        fields = ['id', 'event', 'date', 'checked_in', 'cancelled', 'qr_code']

    def get_qr_code(self, obj):

        # Generate the secure token for this specific registration
        token = generate_ticket_token(obj.id, obj.event.id) 

        # Convert it to Base64 image string
        return generate_qr_code_base64(token)
