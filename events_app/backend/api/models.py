# models.py


from django.db import models
from django.contrib.auth.models import AbstractUser

# Defined a custom user model that uses email for login instead of username
class CustomUser(AbstractUser):

    username = models.CharField(max_length = 150, blank = True, null = True)
    email = models.EmailField(unique = True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  

    def __str__(self):

        return self.email 
