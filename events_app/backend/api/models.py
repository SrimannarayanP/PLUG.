# models.py


from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

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
    virtual_location = models.TextField(blank = True, null = True)
    register_link = models.TextField(blank = True, null = True)
    is_native = models.BooleanField(default = False)
    is_featured = models.BooleanField(default = False)
    poster_field = models.ImageField(upload_to = 'event_posters/', null = True, blank = True)
    age_restriction_cutoff = models.DateField(null = True, blank = True)
    # This is what the host configures
    collect_phone = models.BooleanField(default = False)
    collect_college_school = models.BooleanField(default = False)
    collect_student_id = models.BooleanField(default = False)
    
    organisation = models.ForeignKey(OrganisationProfile, on_delete = models.CASCADE, related_name = 'events')
    categories = models.ManyToManyField(Categories, through = 'EventCategories')

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
    cancelled = models.BooleanField(default = False)
    checked_in = models.BooleanField(default = False)
    checked_in_at = models.DateTimeField(null = True, blank = True)

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
