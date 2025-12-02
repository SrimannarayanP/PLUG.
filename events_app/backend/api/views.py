# views.py



from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import UserSerializer, EventSerializer, TicketSerializer, CustomTokenObtainPairSerializer
from .models import Event, Registrations, CustomUser, StudentProfile
from .utils import generate_ticket_token, generate_qr_code_base64
from .tasks import send_ticket_email_task

import jwt

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):

    serializer_class = CustomTokenObtainPairSerializer


class CreateUserView(generics.CreateAPIView):

    queryset = User.objects.all() # Fetches a list of different objects from the User model, so we don't end up creating the same user
    serializer_class = UserSerializer # Serializer class tells what kind of data we need to accept to make a new user
    permission_classes = [AllowAny] # Sets the permission such that anyone can create a new user


# Gets the user profile data, once the user is authenticated
class UserProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response({

            'id' : user.id,
            'name' : user.username,
            'email' : user.email

        })


class EventListView(generics.ListAPIView):

    queryset = Event.objects.all().order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


class RegisteredEventsView(generics.ListAPIView):

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Registrations.objects.filter(
            student__user = self.request.user,
            cancelled = False
        ).order_by('-date')


# Basically, ye upcoming events dikhata hai. Abhi ka time aur 30 din baad ka time leke, unn dates ke beech me jo bhi events hai, unko return karegi ye view
class UpcomingEventListView(generics.ListAPIView):

    permission_classes = [AllowAny]

    queryset = Event.objects.filter(is_featured = False, start_date__gte = timezone.now()).order_by('start_date')
    serializer_class = EventSerializer


class EventDetailsView(APIView):

    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]


# Returns all the events that have is_featured = True for the Featured section of the website
class FeaturedEventListView(generics.ListAPIView):

    queryset = Event.objects.filter(is_featured = True, start_date__gte = timezone.now()).order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


class RegisterForEventView(APIView):

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):

        data = request.data
        event_id = data.get('event_id')
        user = request.user

        # Find the event
        try:
            event = Event.objects.get(id = event_id, is_native = True)
        except Event.DoesNotExist:
            
            return Response({'error' : "Native event not found."}, status = 404)
        
        # Validate the payload against the event's toggles
        errors = {}

        if event.collect_phone and not data.get('phone_number'):
            errors['phone_number'] = "This field is required."
        if event.collect_college_school and not data.get('school_college_name'):
            errors['school_college_name'] = "This field is required."
        if event.collect_student_id and not data.get('student_id_number'):
            errors['student_id_number'] = "This field is required."

        if not user.is_authenticated:
            
            if not data.get('email') or not data.get('first_name') or not data.get('last_name'):
                errors['guest_info'] = "Name & Email are required for guest registration"

        if errors:

            return Response({'error' : errors}, status = status.HTTP_400_BAD_REQUEST)
        
        # Get or create the user's profile
        if user.is_authenticated:
            student_profile = user.studentprofile
        else:
            user, user_created = CustomUser.objects.get_or_create(
                email = data.get('email'),
                defaults = {
                    'first_name' : data.get('first_name'),
                    'last_name' : data.get('last_name'),
                    'role' : 'student',
                    'email' : data.get('email')

                }
            )
            
            if user_created:
                user.set_unusable_password()
                user.save()

            student_profile, _ = StudentProfile.objects.get_or_create(user = user)

        # Update the profile with the "Smart Fields" data (Saving the user's data for auto pick-up next time)
        if event.collect_phone:
            student_profile.phone_number = data.get('phone_number')
        if event.collect_college_school:
            student_profile.school_college_name = data.get('school_college_name')
        if event.collect_student_id:
            student_profile.student_id_number = data.get('student_id_number')

        student_profile.save()

        # Age check
        if event.age_restriction_cutoff:

            if not student_profile.date_of_birth:

                return Response({'error' : "This is an age-restricted event. Please update your profile DOB."}, status = 403)
            
            if student_profile.date_of_birth > event.age_restriction_cutoff:

                return Response({'error' : "You do not meet the age requirement."}, status = 403)
            
        # Create the registration
        registration, reg_created = Registrations.objects.get_or_create(
            student = student_profile,
            event = event
        )

        if not reg_created and not registration.cancelled:
            
            return Response({'message' : "You are already registered."}, status = 200)
        
        registration.cancelled = False
        registration.save()
        
        # Trigger async task to send ticket email only after the transaction is committed. This is to ensure that Celery & Django go hand-in-hand. Pehle kya hota tha,
        # Django user ko register krta, phir send_ticket_email_task.delay() ko call krta, lekin ye abhi tak DB me reflect hi nhi hua ki naya user bna hai. Isliye Celery
        # task fail ho jata hai, kyunki wo user ko DB me dhundh nhi pata.
        transaction.on_commit(lambda: send_ticket_email_task.delay(registration.id))

        # We'll still generate the Base64 QR for the UI immediately.
        ticket_token = generate_ticket_token(registration.id, event.id)
        qr_code_image = generate_qr_code_base64(ticket_token)

        return Response({
            'message' : "Registration successful! Check your email.",
            'ticket' : {
                'token' : ticket_token,
                'qr_code' : qr_code_image,
                'attendee_name' : f"{student_profile.user.first_name} {student_profile.user.last_name}",
                'event_name' : event.event_name
            }
        }, status = status.HTTP_201_CREATED)
    

# Scans a QR code. Verifies signature. Checks user in.
class VerifyTicketView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        token = request.data.get('token')

        if not token:

            return Response({'error' : "No token provided."}, status = 400)

        try:
            
            # Ensures that the QR code wasn't forged by a student
            payload = jwt.decode(token, settings.TICKET_SIGNING_KEY, algorithms = ['HS256'])

            registration_id = payload.get('rid')
            event_id = payload.get('eid')

            # Database lookup
            registration = Registrations.objects.get(id = registration_id, event_id = event_id)
            
            if registration.cancelled:

                return Response({'error' : "Ticket is CANCELLED"}, status = 400)

            if registration.checked_in:

                return Response({
                    'status' : 'warning',
                    'message' : "ALREADY CHECKED IN",
                    'attendee' : f"{registration.student.user.first_name} {registration.student.user.last_name}",
                    'time' : registration.checked_in_at
                }, status = 200)
            
            registration.checked_in = True
            registration.checked_in_at = timezone.now()
            registration.save()

            return Response({
                'status' : 'success',
                'message' : "VALID TICKET",
                'attendee' : {
                    'name' : f"{registration.student.user.first_name} {registration.student.user.last_name}",
                    'email' : registration.student.user.email,
                    'college' : registration.student.school_college_name or 'N/A',
                    'student_id' : registration.student.student_id_number or 'N/A',
                    'dob' : registration.student.date_of_birth,
                },
                'event' : registration.event.event_name,
            }, status = 200)
        
        except jwt.ExpiredSignatureError:

            return Response({'error' : "Ticket has EXPIRED"}, status = 400)
        
        except jwt.InvalidTokenError:

            return Response({'error' : "INVALID TICKET. Please check again."}, status = 400)
        
        except Registrations.DoesNotExist:

            return Response({'error' : "Ticket not found in system."}, status = 404)
        

class CreateEventView(APIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [MultiPartParser, FormParser] # Parses multipart HTML form content, which supports file uploads. Typically dono, FormParser & MultiPartParser use
                                                    # krte hain HTML forms ke liye.

    def post(self, request, *args, **kwargs):

        user = request.user

        # Check if this user is a host
        if not hasattr(user, 'organisationprofile'):

            return Response({
                'error' : "You must be a host to create events."}, 
                status = status.HTTP_403_FORBIDDEN
            )

        data = request.data 
        serializer = EventSerializer(data = data) # We get the raw data from the request & pass it to the serializer. The serializer than maps this raw data to the
                                                    # 'Event' model fields.
                                                    
        # This method runs all the rules defined in the 'Event' model & 'EventSerializer'. Are required fields present? Is the email valid? etc. It returns True if
        # everything is perfect, false if there is even 1 error.
        if serializer.is_valid():
            # The request.data does not contain the "Organisation ID" (because we don't trust the users to set it). We call .save() but we pass
            # "organisation = user.organisationprofile" as an argument. Toh pehle frontend se event ke poore details aa jaayenge, Django usse validate krega, agar
            # sab sahi rha, phir uss data me "Organisation ID" ko 'inject'/add karega. Phir usko backend me save karega.    
            serializer.save(organisation = user.organisationprofile)

            return Response(serializer.data, status = status.HTTP_201_CREATED)
        else:

            # If is_valid() returned false, the serializer populated a special list called '.errors'. We send this to the frontend so that it can be displayed.
            return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
        

# Returns events where the logged-in user is the organiser
class HostEventListView(generics.ListAPIView):

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        user = self.request.user

        if not hasattr(user, 'organisationprofile'):

            return Event.objects.none()
        
        return Event.objects.filter(organisation = user.organisationprofile).order_by('-start_date')
