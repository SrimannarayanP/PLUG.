# models.py


from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, URLValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

import uuid

# CONSTANTS
MAX_BROCHURE_SIZE_MB = 10
MAX_IMAGE_SIZE_MB = 2


# Validators
# General validator for file size 
def validate_file_size(value, max_mb):
    if value.size > max_mb * 1024 * 1024: # Convert MB to bytes
        
        raise ValidationError(f"File size cannot exceed {max_mb}MB.")
    
def validate_brochure_size(value):
    
    return validate_file_size(value, MAX_BROCHURE_SIZE_MB)

def validate_image_size(value):

    return validate_file_size(value, MAX_IMAGE_SIZE_MB)


# --- Abstract Classes ---
class TimeStampedModel(models.Model):
    """Provides self-updating created_at & updated_at fields"""

    created_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now = True)

    class Meta:

        abstract = True


# Provides a UUID primary key field
class UUIDModel(models.Model):

    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)

    class Meta:

        abstract = True


# --- User Management ---
# To create & save a user with given email ID & password
class CustomUserManager(BaseUserManager):

    def create_user(self, email, password = None, **extra_fields):
        if not email: 

            raise ValueError(_("The email must be set"))
        
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

            raise ValueError(_("Superuser must have is_staff = True."))
        
        if extra_fields.get('is_superuser') is not True:

            raise ValueError(_("Superuser must have is_superuser = True"))
        
        return self.create_user(email, password, **extra_fields)


# Defined a custom user model that uses email for login instead of username
class CustomUser(AbstractUser):
    
    class Role(models.TextChoices):

        STUDENT = 'student', _('Student')
        ADMIN = 'admin', _('Admin')
        HOST = 'host', _('Host')

    username = None
    email = models.EmailField(_('email address'), unique = True)
    role = models.CharField(max_length = 10, choices = Role.choices, default = Role.STUDENT)

    is_email_verified = models.BooleanField(default = False)
    otp = models.CharField(max_length = 6, null = True, blank = True) # CharField because if OTP starts with 0, IntegerField would cutoff the 0.
    otp_created_at = models.DateTimeField(null = True, blank = True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  

    objects = CustomUserManager()

    def __str__(self):

        return self.email 


# --- Lookup Models ---
class Category(models.Model):

    name = models.CharField(max_length = 255, unique = True)

    class Meta:

        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):

        return self.name
    

# Standardized names for colleges to prevent dirty data
class SchoolCollege(TimeStampedModel):

    name = models.CharField(max_length = 255, unique = True)
    city = models.CharField(max_length = 255, blank = True, null = True)
    state = models.CharField(max_length = 255, blank = True, null = True)

    class Meta:

        verbose_name_plural = 'School/College'
        ordering = ['name'] # Arrange the records in alphabetical order by default

    def __str__(self):

        return self.name


# --- Profiles ---
class OrganisationProfile(TimeStampedModel):

    user = models.OneToOneField(CustomUser, on_delete = models.CASCADE, primary_key = True, related_name = 'organisation_profile')
    name = models.CharField(max_length = 255)
    phone_number = models.CharField(max_length = 20, unique = True)

    def __str__(self):

        return self.name


class StudentProfile(TimeStampedModel):

    user = models.OneToOneField(CustomUser, on_delete = models.CASCADE, primary_key = True, related_name = 'student_profile')

    date_of_birth = models.DateField(null = True, blank = True)
    phone_number = models.CharField(max_length = 20, blank = True, null = True)

    school_college = models.ForeignKey(SchoolCollege, on_delete = models.SET_NULL, null = True, blank = True, related_name = 'students')
    
    student_id_number = models.CharField(max_length = 100, blank = True, null = True)

    def __str__(self):

        return self.user.email
    

# --- Core App Models ---
class Event(UUIDModel, TimeStampedModel):

    class LocationType(models.TextChoices):

        ONLINE = 'online', _('Online')
        OFFLINE = 'offline', _('Offline')

    name = models.CharField(max_length = 255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    # Location
    location_type = models.CharField(max_length = 10, choices = LocationType.choices)
    physical_location = models.CharField(max_length = 255, blank = True, null = True)
    google_maps_link = models.TextField(max_length = 255, blank = True, null = True, validators = [URLValidator()])
    virtual_location = models.TextField(blank = True, null = True, help_text = "Meeting link for online events")

    # Registration
    register_link = models.TextField(blank = True, null = True)
    registration_deadline = models.DateTimeField(null = True, blank = True)
    
    # Checks & Assets
    is_native = models.BooleanField(default = False)
    is_featured = models.BooleanField(default = False)
    poster = models.ImageField(
        upload_to = 'event_posters/', 
        null = True, 
        blank = True,
        # Check for file size & format
        validators = [
            FileExtensionValidator(allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']),
            validate_image_size
        ]
    )

    # Payment
    is_paid_event = models.BooleanField(default = False)
    payment_qr_image = models.ImageField(upload_to = 'payment_qr_img/', null = True, blank = True)
    ticket_price = models.DecimalField(max_digits = 10, decimal_places = 2, default = 0.00)

    # Optional Data Collection (Smart Fields)
    age_restriction_cutoff = models.DateField(null = True, blank = True)
    collect_phone = models.BooleanField(default = False)
    collect_college_school = models.BooleanField(default = False)
    collect_student_id = models.BooleanField(default = False)
    
    # Foreign Keys
    organisation = models.ForeignKey(OrganisationProfile, on_delete = models.CASCADE, related_name = 'events')
    categories = models.ManyToManyField(Category, through = 'EventCategory', related_name = 'events')

    class Meta:

        ordering = ['-start_date']

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

        # Location validation
        if self.location_type == self.LocationType.OFFLINE:
            if not self.physical_location:
                
                raise ValidationError({'physical_location' : _("Venue name is required for offline events.")})
            
            if not self.google_maps_link:
                
                raise ValidationError({'google_maps_link' : _("Google Maps link is required for offline events.")})
            
        elif self.location_type == self.LocationType.ONLINE:
            if not self.virtual_location:
            
                raise ValidationError({'virtual_location' : _("Meeting link is required for online events.")})
        
        # Payment validation
        if self.is_paid_event and self.ticket_price <= 0:

            raise ValidationError({'ticket_price' : _("Paid events must have a ticket price greater than 0.")})

    @property
    def is_registration_open(self):
        if not self.registration_deadline:

            return False

        return timezone.now() < self.registration_deadline

    def __str__(self):

        return self.name
    

# Separate table for Event-Category many-to-many relationship
class EventCategory(models.Model):

    event = models.ForeignKey(Event, on_delete = models.CASCADE)
    category = models.ForeignKey(Category, on_delete = models.CASCADE)

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields = ['event', 'category'],
                name = 'unique_event_category',
            )
        ]

        verbose_name_plural = "Event Categories"


class EventDocument(TimeStampedModel):

    event = models.ForeignKey(Event, on_delete = models.CASCADE, related_name = 'documents')
    file = models.FileField(upload_to = 'event_docs/', validators = [validate_brochure_size])
    name = models.CharField(max_length = 255, blank = True)

    def __str__(self):

        return f"{self.name or 'Document'} - {self.event.name}"


class Registration(UUIDModel, TimeStampedModel):

    class PaymentStatus(models.TextChoices):

        PENDING = 'pending', _('Pending')
        VERIFIED = 'verified', _('Verified')
        REJECTED = 'rejected', _('Rejected')

    student = models.ForeignKey(StudentProfile, on_delete = models.CASCADE, related_name = 'registrations')
    event = models.ForeignKey(Event, on_delete = models.CASCADE, related_name = 'registrations')

    # Status flags
    is_cancelled = models.BooleanField(default = False)
    is_checked_in = models.BooleanField(default = False)
    checked_in_at = models.DateTimeField(null = True, blank = True)

    # Payment Tracking
    payment_status = models.CharField(max_length = 20, choices = PaymentStatus.choices, default = PaymentStatus.PENDING)
    transaction_id = models.CharField(max_length = 100, blank = True, null = True, db_index = True)

    class Meta:

        verbose_name_plural = 'Registration'

        indexes = [
            # Get all verified attendees for some event X
            models.Index(fields = ['event', 'payment_status'])
        ]

    # Manually enforce that a student cannot have more than 1 active registrations but can have many cancelled registrations for the same event.
    def clean(self):
        # If this is a new registration or we are updating an existing 1
        # Check if there's another active registration for a student + event combo
        existing_active = Registration.objects.filter(
            student = self.student,
            event = self.event,
            is_cancelled = False
        ).exclude(id = self.id) # Exclude self if we are editing.

        if existing_active.exists() and not self.is_cancelled:

            raise ValidationError("You already have an active registration for this event.")

    def save(self, *args, **kwargs):
        self.clean()
        
        super().save(*args, **kwargs)

    def __str__(self):
        
        return f"{self.student} - {self.event.name}"
