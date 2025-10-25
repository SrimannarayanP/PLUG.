# serializers.py


# Here, we are going to use something called as a serializer. Basically, serializers help in converting Python objects into JSON objects & vice-versa. We'll be using an
# ORM that will help us in converting the database tables into Python objects. So, to convert these Python objects into JSON objects that can be sent over HTTP, we use
# serializers.

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import CustomUser

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:

        model = User

        fields = ['id', 'username', 'email', 'password']

        extra_kwargs = {'password' : {'write_only' : True}} # This ensures that when we're creating a new user, we accept a password but we don't want to return the
                                                            # password when we return info. about the user

    # Really, what's happening here is that the serializer will look at this model, look at all the fields on that model & the ones we've defined, validate them & if the
    # data is valid, it'll pass it as validated_data in the function
    def create(self, validated_data):

        user = User.objects.create_user(**validated_data)

        return user
