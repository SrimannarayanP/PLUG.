# views.py


from django.forms import ValidationError
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import UserSerializer

User = get_user_model()

# Create your views here.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    username_field = 'email'

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

            }

        }
    
class CustomTokenObtainPairView(TokenObtainPairView):

    serializer_class = CustomTokenObtainPairSerializer

class CreateUserView(generics.CreateAPIView):

    queryset = User.objects.all() # Fetches a list of different objects from the User model, so we don't end up creating the same user

    serializer_class = UserSerializer # Serializer class tells what kind of data we need to accept to make a new user
 
    permission_classes = [AllowAny] # Sets the permission such that anyone can create a new user
