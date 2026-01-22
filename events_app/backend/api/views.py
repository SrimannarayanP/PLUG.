# views.py


from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.core.files import File
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from rest_framework import generics, status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import UserSerializer, EventSerializer, TicketSerializer, CustomTokenObtainPairSerializer, SetNewPasswordSerializer, SchoolCollegeSerializer, CategoriesSerializer
from .models import Event, Registrations, CustomUser, StudentProfile, Categories, SchoolCollege, OrganisationProfile
from .utils import generate_ticket_token, generate_qr_code_base64
from .tasks import send_ticket_email_task, send_password_reset_email_task

import jwt, os

User = get_user_model()


# AUTH VIEWS
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
            'name' : f"{user.first_name} {user.last_name}",
            'email' : user.email,
            'role' : user.role,
        })


class RequestPasswordResetView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:

            return Response(
                {'error' : "Email is required."}, 
                status = 400
            )

        try:
            user = User.objects.get(email = email)
        except User.DoesNotExist:
            
            return Response(
                {'message' : "If an account exists, a reset link has been sent."}, 
                status = 200
            )
        
        # 'uid' Encodes the user ID so we know who to look up later
        # 'token' is a unique hash that is valid for a limited time & checks if the password changed recently.
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Construct the frontend link
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"

        transaction.on_commit(lambda: send_password_reset_email_task.delay(email, reset_link))

        return Response(
            {'message' : "If an account exists, a reset link has been sent."}, 
            status = 200
        )


class SetNewPasswordView(generics.GenericAPIView):

    permission_classes = [AllowAny]
    serializer_class = SetNewPasswordSerializer

    # Sends the data to the serializer to be validated. If it is validated, it'll tell to save. Else it'll raise error. 
    def post(self, request):
        serializer = self.get_serializer(data = request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {'message' : "Password set succesfully. You can now login."}, 
                status = 200
            )
        
        return Response(
            serializer.errors, 
            status = 400
        )


# EVENT LISTING VIEWS
class EventListView(generics.ListAPIView):

    queryset = Event.objects.all().order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


# Basically, ye upcoming events dikhata hai. Abhi ka time aur 30 din baad ka time leke, unn dates ke beech me jo bhi events hai, unko return karegi ye view
class UpcomingEventListView(generics.ListAPIView):

    permission_classes = [AllowAny]
    queryset = Event.objects.filter(
        is_featured = False, 
        start_date__gte = timezone.now()
    ).order_by('start_date')
    serializer_class = EventSerializer


# Returns all the events that have is_featured = True for the Featured section of the website
class FeaturedEventListView(generics.ListAPIView):

    queryset = Event.objects.filter(
        is_featured = True, 
        start_date__gte = timezone.now()
    ).order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


class EventDetailsView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny] # This is to allow any un-logged in users to atleast see the event before registering.
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser] # Required for file uploads (poster/brochure)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:

            return Response(
                {'error' : "Authentication required"}, 
                status = 401
            )

        # Get event object
        instance = self.get_object()

        # We assume the user has an 'organisationprofile'. If not, they can't edit the event. Also, check if the event actually belongs to this host
        if not hasattr(request.user, 'organisationprofile') or instance.organisation != request.user.organisationprofile:
            
            return Response(
                {'error' : "Permission denied"}, 
                status = 403
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_authenticated:

            return Response(
                {'error' : "Authentication required"}, 
                status = 401
            )
        
        instance = self.get_object()

        if not hasattr(request.user, 'organisationprofile') or instance.organisation != request.user.organisationprofile:

            return Response(
                {'error' : "Permission denied"}, 
                status = 403
            )
        
        return super().destroy(request, *args, **kwargs)


# HOST SPECIFIC VIEWS
class CreateEventView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Parses multipart HTML form content, which supports file uploads. Typically dono, FormParser & MultiPartParser use
                                                    # krte hain HTML forms ke liye.

    def post(self, request, *args, **kwargs):
        user = request.user

        # Check if this user is a host
        if not hasattr(user, 'organisationprofile'):

            return Response(
                {'error' : "Only a host can create events."}, 
                status = 403
            )

        # Deserializing the data (Converting it back into the respective object type)
        serializer = EventSerializer(data = request.data) # We get the raw data from the request & pass it to the serializer. The serializer than maps this raw data to
                                                    # the 'Event' model fields.
                                                    
        # This method runs all the rules defined in the 'Event' model & 'EventSerializer'. Are required fields present? Is the email valid? etc. It returns True if
        # everything is perfect, false if there is even 1 error.
        if serializer.is_valid():
            # The request.data does not contain the "Organisation ID" (because we don't trust the users to set it). We call .save() but we pass
            # "organisation = user.organisationprofile" as an argument. Toh pehle frontend se event ke poore details aa jaayenge, Django usse validate krega, agar
            # sab sahi rha, phir uss data me "Organisation ID" ko 'inject'/add karega. Phir usko backend me save karega.    
            serializer.save(organisation = user.organisationprofile)

            is_paid = request.data.get('is_paid_event') == 'true'

            if is_paid:
                qr_path = os.path.join(settings.MEDIA_ROOT, 'platform_qr.jpg')

                if os.path.exists(qr_path):
                    with open(qr_path, 'rb') as f:
                        serializer.save(
                            payment_qr_image = File(f, name = 'platform_qr.jpg'),
                        )

            return Response(
                serializer.data, 
                status = 201
            )
        else:
            # If is_valid() returned false, the serializer populated a special list called '.errors'. We send this to the frontend so that it can be displayed.
            return Response(
                serializer.errors, 
                status = 400
            )
        

# Returns events where the logged-in user is the organiser
class HostEventListView(generics.ListAPIView):

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, 'organisationprofile'):

            return Event.objects.none()
        
        return Event.objects.filter(organisation = user.organisationprofile).order_by('-start_date')


# Returns stats & list of attendees for a specific event. Only hosts can access this.
class HostEventDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        user = request.user

        try:
            profile = user.organisationprofile
            event = Event.objects.get(
                id = event_id, 
                organisation = profile
            )
        except (AttributeError, Event.DoesNotExist):

            return Response(
                {'error' : "Event not found or you do not have permission to view it."}, 
                status = 403
            )

        # Stats
        total_registrations = Registrations.objects.filter(
            event = event, 
            cancelled = False
        ).count()
        checked_in_count = Registrations.objects.filter(
            event = event, 
            checked_in = True, 
            cancelled = False
        ).count()

        # Attendee List (.select_related avoids the problem of running 100 SQL queries for 100 students)
        registrations = Registrations.objects.filter(
            event = event, 
            cancelled = False
        ).select_related('student__user').order_by('-date')

        attendees = []

        for reg in registrations:
            school_college_name = reg.student.school_college.name if reg.student.school_college else 'N/A'

            attendees.append({
                'id' : reg.id,
                'name' : f"{reg.student.user.first_name} {reg.student.user.last_name}",
                'email' : reg.student.user.email,
                'phone' : reg.student.phone_number,
                'college' : school_college_name,
                'student_id' : reg.student.student_id_number,
                'checked_in' : reg.checked_in,
                'registered_at' : reg.date,
                'payment_status' : reg.payment_status,
                'transaction_id' : reg.transaction_id,
            })

        return Response({
            'event' : EventSerializer(event).data,
            'stats' : {
                'total' : total_registrations,
                'checked_in' : checked_in_count,
            },
            'attendees' : attendees
        })


class ProcessPaymentView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        user = request.user
        data = request.data

        registration_id = data.get('registration_id')
        action = data.get('action')

        if not registration_id or action not in ['approve', 'reject']:

            return Response(
                {'error' : "Invalid request"}, 
                status = 400
            )
        
        try:
            # We filter by the registration ID & the organisation linked to the logged-in host. This prevents hackers from approving tickets for other people's events.
            registration = Registrations.objects.get(
                id = registration_id,
                event__organisation__user = user # Checks if event belongs to host
            )
        except Registrations.DoesNotExist:

            return Response(
                {'error' : "Registration not found or authorized."}, 
                status = 403
            )
        
        # Handle rejection
        if action == 'reject':
            registration.payment_status = 'rejected'
            registration.cancelled = True
            registration.save()

            return Response(
                {'message' : "Registration rejected."}, 
                status = 200
            )
        
        # Handle approval
        if action == 'approve':
            # Don't verify again if already verified
            if registration.payment_status == 'verified':

                return Response(
                    {'message' : "Already verified."}, 
                    status = 200
                )
            
            registration.payment_status = 'verified'
            registration.cancelled = False
            registration.save()

            transaction.on_commit(lambda: send_ticket_email_task.delay(registration.id))

            return Response(
                {'message' : "Payment verified. Ticket sent to student."}, 
                status = 200
            )
        

# STUDENT & TICKET VIEWS
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
            
            return Response(
                {'error' : "Native event not found."}, 
                status = 404
            )
        
        if timezone.now() > event.registration_deadline:

            return Response(
                {'error' : f"Registration for this event closed on {event.registration_deadline.strftime(r"%d %b, %I:%M %p")}."}, 
                status = 400
            )
        
        # Validate the payload against the event's toggles
        errors = {}

        if event.collect_phone and not data.get('phone_number'):
            errors['phone_number'] = "This field is required."

        if event.collect_college_school and not data.get('school_college_id'):
            errors['school_college'] = "This field is required."

        if event.collect_student_id and not data.get('student_id_number'):
            errors['student_id_number'] = "This field is required."

        if event.is_paid_event:
            if not data.get('transaction_id'):
                errors['transaction_id'] = "Transaction ID is required for paid events."

        if not user.is_authenticated:
            if not data.get('email') or not data.get('first_name') or not data.get('last_name'):
                errors['guest_info'] = "Name & Email are required for guest registration"

        if errors:

            return Response(
                {'error' : errors}, 
                status = 400
            )
        
        # Get or create the user's profile
        if user.is_authenticated:
            if not hasattr(user, 'studentprofile'):

                return Response(
                    {'error' : "Only students can register for events."}, 
                    status = 403
                )
            
            student_profile = user.studentprofile
        else:
            email = data.get('email')

            if CustomUser.objects.filter(email = email).exists():

                return Response(
                    {'error' : "An account with this email already exists. Please log in to register."}, 
                    status = 403
                )
            
            user, user_created = CustomUser.objects.get_or_create(
                email = email,
                defaults = {
                    'first_name' : data.get('first_name'),
                    'last_name' : data.get('last_name'),
                    'role' : 'student',
                    'email' : email,
                }
            )
            
            if user_created:
                user.set_unusable_password()
                user.save()

                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

            student_profile, _ = StudentProfile.objects.get_or_create(user = user)

        # Update the profile with the "Smart Fields" data (Saving the user's data for auto pick-up next time)
        if event.collect_phone:
            student_profile.phone_number = data.get('phone_number')

        if event.collect_college_school:
            school_college_id = data.get('school_college_id')

            if school_college_id:
                try:
                    student_profile.school_college = SchoolCollege.objects.get(id = school_college_id)
                except SchoolCollege.DoesNotExist:

                    return Response(
                        {'error' : "Invalid college selected."},
                        status = 400
                    )

        if event.collect_student_id:
            student_profile.student_id_number = data.get('student_id_number')

        student_profile.save()

        # Age check
        if event.age_restriction_cutoff:
            if not student_profile.date_of_birth:

                return Response(
                    {'error' : "This is an age-restricted event. Please update your DOB."}, 
                    status = 403
                )
            
            if student_profile.date_of_birth > event.age_restriction_cutoff:

                return Response(
                    {'error' : "You do not meet the age requirement."}, 
                    status = 403
                )
            
        # Create the registration
        registration, reg_created = Registrations.objects.get_or_create(
            student = student_profile,
            event = event
        )

        if not reg_created and not registration.cancelled:
            
            return Response(
                {'message' : "You are already registered."}, 
                status = 200
            )
        
        registration.cancelled = False

        # Handling payment state
        if event.is_paid_event:
            registration.transaction_id = data.get('transaction_id')

            if reg_created or registration.payment_status in ['rejected', 'verified']:
                registration.payment_status = 'pending'

            registration.save()

            return Response({
                'message' : "Payment submitted. Waiting for host's approval.",
                'payment_needed' : True,
                'registration' : {
                    'id' : registration.id,
                    'attendee_name' : f"{user.first_name} {user.last_name}",
                    'email' : user.email,
                    'status' : registration.payment_status,
                }
            }, status = 200)
        else:
            registration.payment_status = 'verified'
            registration.save()

            ticket_token = generate_ticket_token(registration.id, event.id)
            qr_code_image = generate_qr_code_base64(ticket_token)

            transaction.on_commit(lambda: send_ticket_email_task.delay(registration.id))

        # Free registration for event flow
        registration.payment_status = 'verified'
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
                'event_name' : event.event_name,
                'is_pending' : False,
            }
        }, status = 201)


class RegisteredEventsView(generics.ListAPIView):

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Registrations.objects.filter(
            student__user = self.request.user,
            cancelled = False
        ).select_related(
            'event', # Fetches event details
            'event__organisation', # Fetches host details 
            'student__school_college' # Fetches college details
        ).order_by('-date')
    

# Scans a QR code. Verifies signature. Checks user in.
class VerifyTicketView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')

        if not token:

            return Response(
                {'error' : "No token provided."}, 
                status = 400
            )

        try:
            # Ensures that the QR code wasn't forged by a student
            payload = jwt.decode(
                token, 
                settings.TICKET_SIGNING_KEY, 
                algorithms = ['HS256']
            )

            registration_id = payload.get('rid')
            event_id = payload.get('eid')

            # Database lookup
            registration = Registrations.objects.get(
                id = registration_id, 
                event_id = event_id
            )
            
            if registration.cancelled:

                return Response(
                    {'error' : "Ticket is CANCELLED"}, 
                    status = 400
                )

            if registration.checked_in:

                return Response({
                    'status' : 'warning',
                    'message' : "ALREADY CHECKED IN",
                    'attendee' : f"{registration.student.user.first_name} {registration.student.user.last_name}",
                    'time' : registration.checked_in_at
                }, status = 200)
            
            school_college_name = registration.student.school_college.name if registration.student.school_college else 'N/A'
            
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

            return Response(
                {'error' : "Ticket has EXPIRED"}, 
                status = 400
            )
        
        except jwt.InvalidTokenError:

            return Response(
                {'error' : "INVALID TICKET. Please check again."}, 
                status = 400
            )
        
        except Registrations.DoesNotExist:

            return Response(
                {'error' : "Ticket not found in system."}, 
                status = 404
            )


# DROPDOWN DATA VIEWS
# Public endpoint to fetch all categories
class CategoryListView(generics.ListAPIView):

    queryset = Categories.objects.all()
    serializer_class = CategoriesSerializer
    permission_classes = [AllowAny]
    pagination_class = None


# Public endpoint to fetch all supported colleges for the signup dropdown.
class SchoolCollegeListView(generics.ListAPIView):

    queryset = SchoolCollege.objects.all()
    serializer_class = SchoolCollegeSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Since it's a dropdown, the frontend should get the full list at once. Or else, it'll send some at once & won't show the others.
