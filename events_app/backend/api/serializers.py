# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

# We're only getting data that we want to send to the frontend

from django.db import transaction
from django.contrib.auth import get_user_model, authenticate
from django.forms import ValidationError
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

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
    categories = serializers.StringRelatedField(many = True, read_only = True)
    organiser = serializers.CharField(source = 'organisation.name', read_only = True)
    organisation = serializers.SerializerMethodField()
    # File fields
    payment_qr_image = serializers.ImageField(read_only = True) # Frontend needs to read it to display it.
    poster_field = serializers.ImageField(max_length = None, use_url = True, required = False)

    def get_location(self, obj):
        if obj.location_type == 'offline' and obj.physical_location:

            return obj.physical_location
        if obj.location_type == 'online':

            return obj.virtual_location or 'Online'
        
        return 'TBD'
    
    def get_organisation(self, obj):

        return OrganisationSerializer(obj.organisation).data

    class Meta:

        model = Event
        fields = '__all__'
        

class CategoriesSerializer(serializers.ModelSerializer):

    class Meta:

        model = Categories
        fields = ['name']


class TicketSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only = True)
    qr_code = serializers.SerializerMethodField()

    class Meta:

        model = Registrations
        fields = ['id', 'event', 'date', 'checked_in', 'cancelled', 'qr_code', 'payment_status']

    def get_qr_code(self, obj):

        # Generate the secure token for this specific registration
        token = generate_ticket_token(obj.id, obj.event.id) 

        # Convert it to Base64 image string
        return generate_qr_code_base64(token)
