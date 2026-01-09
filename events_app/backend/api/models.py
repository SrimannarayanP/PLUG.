# models.py


from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, URLValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager, User
from django.db import models
from django.utils import timezone

import uuid


def validate_brochure_size(value):
    filesize = value.size
    
    if filesize > 5 * 1024 * 1024: # 5MB
        
        raise ValidationError("The max. file size that can be uploaded is 5MB")
    
def validate_image_size(value):
    filesize = value.size

    if filesize > 2 * 1024 * 1024: # 2MB
        
        raise ValidationError("The max. image size is 2MB. Please compress your image.")


# To create & save a user with given email ID & password
class CustomUserManager(BaseUserManager):

    def create_user(self, email, password = None, **extra_fields):
        if not email: 

            raise ValueError("The email must be set")
        
        email = self.normalize_email(email)
        user = self.model(email = email, **extra_fields)
        user.set_password(password)
        user.save(using = self.db)

        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:

            raise ValueError("Superuser must have is_staff = True")
        
        if extra_fields.get('is_superuser') is not True:

            raise ValueError("Superuser must have is_superuser = True")
        
        return self.create_user(email, password, **extra_fields)


# Defined a custom user model that uses email for login instead of username
class CustomUser(AbstractUser):

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
        ('host', 'Host')
    ]

    username = models.CharField(max_length = 150, blank = True, null = True)
    email = models.EmailField(unique = True)
    role = models.CharField(max_length = 10, choices = ROLE_CHOICES, default = 'student')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  

    objects = CustomUserManager()

    def __str__(self):

        return self.email 


class Categories(models.Model):

    name = models.CharField(max_length = 500)

    def __str__(self):

        return self.name


class OrganisationProfile(models.Model):

    user = models.OneToOneField(CustomUser, on_delete = models.CASCADE, primary_key = True, limit_choices_to = {'role' : 'host'})
    name = models.CharField(max_length = 500)
    ph_no = models.CharField(max_length = 20, unique = True)

    def __str__(self):

        return self.name
    

class Event(models.Model):

    LOCATION_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]

    event_name = models.CharField(max_length = 500)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location_type = models.CharField(max_length = 10, choices = LOCATION_CHOICES)
    physical_location = models.CharField(max_length = 500, blank = True, null = True)
    google_maps_link = models.TextField(max_length = 500, blank = True, null = True, validators = [URLValidator()])
    virtual_location = models.TextField(blank = True, null = True)
    register_link = models.TextField(blank = True, null = True)
    registration_deadline = models.DateTimeField(null = True, blank = True)
    
    # Brochure field
    brochure = models.FileField(
        upload_to = 'event_brochures/', 
        null = True, 
        blank = True,
        # Check for file type & size
        validators = [
            FileExtensionValidator(allowed_extensions = ['pdf', 'doc', 'docx']),
            validate_brochure_size
        ],
        help_text = "Upload a PDF/Doc file (Max. 5MB)"
    )

    is_native = models.BooleanField(default = False)
    is_featured = models.BooleanField(default = False)
    
    # Image Field
    poster_field = models.ImageField(
        upload_to = 'event_posters/', 
        null = True, 
        blank = True,
        # Check for file size & format
        validators = [
            FileExtensionValidator(allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']),
            validate_image_size
        ]
    )

    # Payment Fields
    is_paid_event = models.BooleanField(default = False)
    payment_qr_image = models.ImageField(upload_to = 'payment_qr_img/', null = True, blank = True)
    ticket_price = models.DecimalField(max_digits = 10, decimal_places = 2, default = 0.00)

    # Smart Fields
    age_restriction_cutoff = models.DateField(null = True, blank = True)
    collect_phone = models.BooleanField(default = False)
    collect_college_school = models.BooleanField(default = False)
    collect_student_id = models.BooleanField(default = False)
    
    # Foreign Keys
    organisation = models.ForeignKey(OrganisationProfile, on_delete = models.CASCADE, related_name = 'events')
    categories = models.ManyToManyField(Categories, through = 'EventCategories')

    def save(self, *args, **kwargs):

        # If the host didn't provide a deadline, take the default to be the event start date
        if not self.registration_deadline:
            self.registration_deadline = self.start_date

        # Can't have a deadline after the event starts
        if self.registration_deadline > self.start_date:
            
            raise ValueError("Registration deadline cannot be after the start date.")

        super().save(*args, **kwargs)

    def clean(self):
        super().clean()

        if self.location_type == 'offline':
            if not self.physical_location:
                
                raise ValidationError({'physical_location' : "Venue name is required for offline events."})
            
            if not self.google_maps_link:
                
                raise ValidationError({'google_maps_link' : "Google Maps link is required for offline events."})
            
        if self.location_type == 'online' and not self.virtual_location:
            
            raise ValidationError({'virtual_location' : "Meeting link is required for online events."})

    @property
    def is_registration_open(self):

        return timezone.now() < self.registration_deadline

    def __str__(self):

        return self.event_name
    

class EventCategories(models.Model):

    event = models.ForeignKey(Event, on_delete = models.CASCADE)
    category = models.ForeignKey(Categories, on_delete = models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['event', 'category'],
                name = 'unique_event_category',
            )
        ]


class StudentProfile(models.Model):

    user = models.OneToOneField(CustomUser, on_delete = models.CASCADE, primary_key = True, limit_choices_to = {'role' : 'student'})
    date_of_birth = models.DateField(null = True, blank = True)
    phone_number = models.CharField(max_length = 20, blank = True, null = True)
    school_college_name = models.CharField(max_length = 255, blank = True, null = True)
    student_id_number = models.CharField(max_length = 100, blank = True, null = True)

    def __str__(self):

        return self.user.email


class Registrations(models.Model):

    student = models.ForeignKey(StudentProfile, on_delete = models.CASCADE, related_name = 'registrations')
    event = models.ForeignKey(Event, on_delete = models.CASCADE, related_name = 'registrations')
    date = models.DateTimeField(auto_now_add = True)

    # Status flags
    cancelled = models.BooleanField(default = False)
    checked_in = models.BooleanField(default = False)
    checked_in_at = models.DateTimeField(null = True, blank = True)

    # Payment Tracking
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    payment_status = models.CharField(max_length = 20, choices = PAYMENT_STATUS_CHOICES, default = "pending")
    transaction_id = models.CharField(max_length = 100, blank = True, null = True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['student', 'event'],
                # condition = models.Q(cancelled = False),
                name = 'unique_student_event_registration',
            )
        ]

    def __str__(self):
        
        return f"{self.student} - {self.event.event_name}"
