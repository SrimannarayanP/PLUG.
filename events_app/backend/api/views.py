# views.py


from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.files import File
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, CustomUser, Event, OrganisationProfile, Registration, SchoolCollege, StudentProfile
from .permissions import IsEmailVerified, IsEventOwner, IsHostUser 
from .serializers import (AttendeeListSerializer, BulkRegistrationSerializer, CategorySerializer, CustomTokenObtainPairSerializer, EventSerializer, RegistrationSerializer,
                          SchoolCollegeSerializer, SetNewPasswordSerializer, UserSerializer)
from .tasks import send_password_reset_email, send_ticket_email, send_verification_email
from .utils import generate_qr_code_base64, generate_ticket_token, generate_otp

import jwt, os

User = get_user_model()


# --- Auth Views ---
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
        serializer = UserSerializer(request.user)

        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data = request.data, partial = True) # Allows us to store only some fields instead of all

        if hasattr(request.user, 'student_profile'):
            profile = request.user.student_profile

            school_college_id = request.data.get('school_college_id')
            school_college_name = request.data.get('school_college_name', '').strip()
            school_college_city = request.data.get('school_college_city', '').strip()
            school_college_state = request.data.get('school_college_state', '').strip()

            if school_college_id:
                profile.school_college_id = school_college_id

                profile.save()
            elif school_college_name:
                school_college = SchoolCollege.objects.filter(
                    name__iexact = school_college_name.strip(),
                    city__iexact = school_college_city.strip()
                ).first()

                if not school_college:
                    school_college = SchoolCollege.objects.create(
                        name = school_college_name.strip(),
                        city = school_college_city.strip(),
                        state = school_college_state.strip()
                    )

                profile.school_college = school_college

                profile.save()

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(serializer.errors, status = 400)


class RequestPasswordResetView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)

        try:
            user = User.objects.filter(email = email).first()

            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk)) # 'uid' Encodes the user ID so we know who to look up later
                token = default_token_generator.make_token(user) # 'token' is a unique hash that is valid for a limited time & checks if the password changed recently.

                frontend_url = getattr(settings, 'FRONTEND_URL', 'https://localhost:5173')
                reset_link = f'{frontend_url}/set-password/{uid}/{token}'

                transaction.on_commit(lambda: send_password_reset_email.delay(email, reset_link))
        except Exception as e:
            print(f"Error sending password reset: {e}")
            
            pass

        return Response({'message' : "If an account exists, a reset link has been sent."}, status = 200)


class SetNewPasswordView(generics.GenericAPIView):

    permission_classes = [AllowAny]
    serializer_class = SetNewPasswordSerializer

    # Sends the data to the serializer to be validated. If it is validated, it'll tell to save. Else it'll raise error. 
    def post(self, request):
        serializer = self.get_serializer(data = request.data)

        if serializer.is_valid():
            serializer.save()

            return Response({'message' : "Password reset succesfully. You can now login."}, status = 200)
        
        return Response(serializer.errors, status = 400)


# --- Email Verification Views ---
class VerifyEmailOTPView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        otp_input = request.data.get('otp')

        if not otp_input:

            return Response({'error' : "OTP is required."}, status = 400)
        
        # Block if already verified.
        if user.is_email_verified:

            return Response({'message' : "Email is already verified."}, status = 200)
        
        # Check if OTP matches using string comparison.
        if user.otp != str(otp_input).strip():

            return Response({'error' : "Invalid OTP. Please check your email."}, status = 400)

        if not user.otp_created_at or timezone.now() > user.otp_created_at + timedelta(minutes = 10):

            return Response({'error' : "OTP has expired. Please request a new one."}, status = 400)
        
        user.is_email_verified = True
        user.otp = None # Clear OTP to prevent reuse
        user.otp_created_at = None
        user.save()

        return Response({'message' : "Email verified successfully!"}, status = 200)
    

class ResendOTPView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_email_verified:

            return Response({'message' : "Email is already verified."}, status = 200)
        
        # Rate limiting
        if user.otp_created_at and timezone.now() < user.otp_created_at + timedelta(minutes = 1):
            wait_time = int(60 - (timezone.now() - user.otp_created_at).total_seconds())

            return Response({'error' : f"Please wait {wait_time} seconds before resending."}, status = 429)
        
        new_otp = generate_otp()
        
        user.otp = new_otp
        user.otp_created_at = timezone.now()
        user.save()

        send_verification_email.delay(str(user.id), new_otp)

        return Response({'message' : "New verification code sent."}, status = 200)


# --- Public Event Views ---
class EventListView(generics.ListAPIView):

    queryset = Event.objects.all().select_related('organisation').order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


# Basically, ye upcoming events dikhata hai. Abhi ka time aur 30 din baad ka time leke, unn dates ke beech me jo bhi events hai, unko return karegi ye view
class UpcomingEventListView(generics.ListAPIView):

    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    def get_queryset(self):

        queryset = Event.objects.filter(is_featured = False, start_date__gte = timezone.now()).select_related('organisation').order_by('start_date')

        category_id = self.request.query_params.get('category_id')

        if category_id:
            queryset = queryset.filter(categories__id = category_id)

        return queryset


class FeaturedEventListView(generics.ListAPIView):
    """Returns all the events that have is_featured = True for the Featured section of the website"""

    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        
        return Event.objects.filter(is_featured = True, start_date__gte = timezone.now()).select_related('organisation').order_by('start_date')


class EventDetailsView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny] # This is to allow any un-logged in users to atleast see the event before registering.
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser] # Required for file uploads (poster/brochure)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:

            return [AllowAny()]
        
        return [IsAuthenticated(), IsHostUser(), IsEventOwner()]


# --- Host Specific Views ---
class CreateEventView(APIView):

    permission_classes = [IsAuthenticated, IsHostUser, IsEmailVerified]
    parser_classes = [FormParser, MultiPartParser] # Parses multipart HTML form content, which supports file uploads. Typically dono, FormParser & MultiPartParser use
                                                    # krte hain HTML forms ke liye.

    def post(self, request, *args, **kwargs):
        user = request.user
        # Deserializing the data (Converting it back into the respective object type)
        serializer = EventSerializer(data = request.data) # We get the raw data from the request & pass it to the serializer. The serializer than maps this raw data to
                                                    # the 'Event' model fields.

        # This method runs all the rules defined in the 'Event' model & 'EventSerializer'. Are required fields present? Is the email valid? etc. It returns True if
        # everything is perfect, false if there is even 1 error.
        if serializer.is_valid():
            # The request.data does not contain the "Organisation ID" (because we don't trust the users to set it). We call .save() but we pass
            # "organisation = user.organisationprofile" as an argument. Toh pehle frontend se event ke poore details aa jaayenge, Django usse validate krega, agar
            # sab sahi rha, phir uss data me "Organisation ID" ko 'inject'/add karega. Phir usko backend me save karega.    
            save_kwargs = {'organisation' : user.organisation_profile}

            is_paid = request.data.get('is_paid_event') == 'true'

            if is_paid:
                qr_path = os.path.join(settings.MEDIA_ROOT, 'platform_qr.jpg')

                if os.path.exists(qr_path):
                    # We open the file here but we pass it into save_kwargs
                    with open(qr_path, 'rb') as f:
                        django_file = File(f, name = 'platform_qr.jpg')
                        
                        save_kwargs['payment_qr_image'] = django_file

                        # Single save call
                        serializer.save(**save_kwargs)
                else:
                    serializer.save(**save_kwargs)
            else:
                # For free event
                serializer.save(**save_kwargs)

            return Response(serializer.data, status = 201)
        
        # If is_valid() returned false, the serializer populated a special list called '.errors'. We send this to the frontend so that it can be displayed.
        return Response(serializer.errors, status = 400)
                                                                

class HostEventListView(generics.ListAPIView):
    """Returns events where the logged-in user is the organiser"""

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsHostUser]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user

        return Event.objects.filter(organisation = user.organisation_profile).order_by('-start_date')


class HostEventDetailView(APIView):
    """Returns stats & list of attendees for a specific event. Only hosts can access this."""

    permission_classes = [IsAuthenticated, IsHostUser]

    def get(self, request, event_id):
        user = request.user

        profile = user.organisation_profile

        event = get_object_or_404(Event, id = event_id, organisation = profile)
        
        # Attendee List (.select_related avoids the problem of running 100 SQL queries for 100 students)
        registrations = Registration.objects.filter(
            event = event, 
            is_cancelled = False
        ).select_related('student__user', 'student__school_college').order_by('-created_at')

        search_query = request.query_params.get('search', None)

        if search_query:
            registrations = registrations.filter(
                Q(first_name__icontains = search_query) |
                Q(last_name__icontains = search_query) |
                Q(email__icontains = search_query) |
                Q(student__student_id_number__icontains = search_query)
            )
        
        # Stats
        total_registrations = Registration.objects.filter(event = event, is_cancelled = False).count()
        checked_in_count = Registration.objects.filter(event = event, is_checked_in = True, is_cancelled = False).count()

        attendee_serializer = AttendeeListSerializer(registrations, many = True)

        return Response({
            'event' : EventSerializer(event).data,
            'stats' : {
                'total' : total_registrations,
                'checked_in' : checked_in_count,
            },
            'attendees' : attendee_serializer.data
        })


# Allows the host to get event details (to edit them), update the details (rename event, add more files etc.) & delete the event.
class HostEventUpdateView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [FormParser, MultiPartParser]

    def get_queryset(self):
        if hasattr(self.request.user, 'organisation_profile'):

            return Event.objects.filter(organisation = self.request.user.organisation_profile)

        return Event.objects.none()


class ProcessPaymentView(APIView):

    permission_classes = [IsAuthenticated, IsHostUser]

    @transaction.atomic
    def post(self, request):
        user = request.user

        registration_id = request.data.get('registration_id')
        action = request.data.get('action')

        if action not in ['approve', 'reject']:

            return Response({'error' : "Invalid action"}, status = 400)
        
        try:
            # We filter by the registration ID & the organisation linked to the logged-in host. This prevents hackers from approving tickets for other people's events.
            registration = Registration.objects.select_for_update().get(id = registration_id, event__organisation = user.organisation_profile) # Checks if event belongs to host
        except Registration.DoesNotExist:

            return Response({'error' : "Registration not found or authorized."}, status = 404)
        
        # Handle rejection
        if action == 'reject':
            registration.payment_status = Registration.PaymentStatus.REJECTED
            registration.is_cancelled = True
            registration.save()

            return Response({'message' : "Registration rejected."}, status = 200)
        
        # Handle approval
        if action == 'approve':
            # Don't verify again if already verified
            if registration.payment_status == Registration.PaymentStatus.VERIFIED:

                return Response({'message' : "Already verified."}, status = 200)
            
            registration.payment_status = Registration.PaymentStatus.VERIFIED
            registration.is_cancelled = False
            registration.save()

            transaction.on_commit(lambda: send_ticket_email.delay(str(registration.id)))

            return Response({'message' : "Payment verified. Ticket sent to student."}, status = 200)
        

# --- Student & Ticket Views ---
class RegisterForEventView(APIView):

    permission_classes = [IsAuthenticated]

    def _validate_event_requirements(self, event, data, user):
        """Helper to validate smart fields & user data"""
        errors = {}

        if event.collect_phone and not data.get('phone_number'):
            errors['phone_number'] = "Phone number is required."

        if event.collect_college_school and not data.get('school_college_id'):
            errors['school_college'] = "College selection is required."

        if event.collect_student_id and not data.get('student_id_number'):
            errors['student_id_number'] = "Student ID is required."

        if event.is_paid_event and not data.get('transaction_id'):
            errors['transaction_id'] = "Transaction ID is required."

        if not user.is_authenticated and (not data.get('email') or not data.get('first_name')):
            errors['guest_info'] = "Guest details required."

        return errors

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = BulkRegistrationSerializer(data = request.data, context = {'request' : request})

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)

        data = serializer.validated_data
        event = data['event']
        attendees = data['attendees']
        user = request.user
        student_profile = user.student_profile

        # Deadline check
        if not event.is_registration_open:

            return Response({'error' : f"Registration for this event closed on {event.registration_deadline.strftime(r"%d %b, %I:%M %p")}."}, status = 400)

        buyer_data = attendees[0]
        profile_updated = False

        # Phone check
        if event.collect_phone and not student_profile.phone_number:
            student_profile.phone_number = buyer_data.get('phone_number')

            profile_updated = True

        # College check
        if event.collect_college_school and not student_profile.school_college:
            school_college_id = data.get('school_college_id')
            school_college_name = data.get('school_college_name')

            if school_college_id:
                student_profile.school_college_id = school_college_id

                profile_updated = True
            elif school_college_name:
                school_college_city = data.get('school_college_city').strip()
                school_college_state = data.get('school_college_state').strip()

                school_college = SchoolCollege.objects.filter(
                    name__iexact = school_college_name.strip(),
                    city__iexact = school_college_city.strip(),
                    state__iexact = school_college_state.strip()
                ).first()

                if not school_college:
                    school_college = SchoolCollege.objects.create(
                        name = school_college_name.strip(),
                        city = school_college_city.strip(),
                        state = school_college_state.strip()
                    )

                student_profile.school_college = school_college

                profile_updated = True

        # Student ID check
        if event.collect_student_id and not student_profile.student_id_number:
            student_profile.student_id_number = buyer_data.get('student_id_number')

            profile_updated = True

        if event.age_restriction_cutoff and not student_profile.date_of_birth:
            dob = buyer_data.get('date_of_birth')

            if dob:
                student_profile.date_of_birth = dob

                profile_updated = True

        # Save the new data if we found any.
        if profile_updated:
            student_profile.save()

        created_registrations = []
        
        for i, attendee in enumerate(attendees):
            is_buyer = (i == 0)

            if is_buyer:
                reg_email = user.email
                reg_first_name = user.first_name
                reg_last_name = user.last_name
            else:
                reg_email = attendee.get('email', user.email)
                reg_first_name = attendee.get('first_name', 'Guest')
                reg_last_name = attendee.get('last_name', '')

            # String form of college name
            school_college_name_str = None
            school_college_id = attendee.get('school_college_id')

            if school_college_id:
                try:
                    sc = SchoolCollege.objects.get(id = attendee['school_college_id'])
                    school_college_name_str = f"{sc.name} ({sc.city})"
                except SchoolCollege.DoesNotExist:
                    pass
            elif attendee.get('school_college_name'):
                school_college_name_str = attendee.get('school_college_name')
            elif is_buyer and student_profile.school_college:
                sc = student_profile.school_college
                school_college_name_str = f"{sc.name} ({sc.city})"

            guest_extra_info = {}

            if school_college_name_str:
                guest_extra_info['school_college_name'] = school_college_name_str
            if attendee.get('phone_number'):
                guest_extra_info['phone_number'] = attendee.get('phone_number')
            if attendee.get('student_id_number'):
                guest_extra_info['student_id_number'] = attendee.get('student_id_number')
            if attendee.get('date_of_birth'):
                guest_extra_info['date_of_birth'] = str(attendee.get('date_of_birth'))

            registration = Registration.objects.create(
                student = student_profile,
                event = event,
                email = reg_email,
                first_name = reg_first_name,
                last_name = reg_last_name,
                guest_data = guest_extra_info,
                is_cancelled = False,
                payment_status = Registration.PaymentStatus.PENDING if event.is_paid_event else Registration.PaymentStatus.VERIFIED,
                transaction_id = data.get('transaction_id')
            )

            created_registrations.append(registration)

        # Handling payment state
        if event.is_paid_event:

            return Response({
                'message' : "Payment submitted. Waiting for host's approval.",
                'count' : len(created_registrations)
            }, status = 201)
        
        ticket_token = generate_ticket_token(str(registration.id), str(event.id))
        qr_code_image = generate_qr_code_base64(ticket_token)

        # Trigger async task to send ticket email only after the transaction is committed. This is to ensure that Celery & Django go hand-in-hand. Pehle kya hota tha,
        # Django user ko register krta, phir send_ticket_email_task.delay() ko call krta, lekin ye abhi tak DB me reflect hi nhi hua ki naya user bna hai. Isliye Celery
        # task fail ho jata hai, kyunki wo user ko DB me dhundh nhi pata.
        for reg in created_registrations:
            transaction.on_commit(lambda r = reg: send_ticket_email.delay(str(r.id)))

        return Response({
            'message' : "Registration successful! Check your email.",
            'tickets' : len(created_registrations)
        }, status = 201)


class RegisteredEventsView(generics.ListAPIView):

    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Registration.objects.filter(
            student__user = self.request.user,
            is_cancelled = False
        ).select_related(
            'event', # Fetches event details
            'event__organisation', # Fetches host details 
            'student__school_college' # Fetches college details
        ).order_by('-created_at')
    

# Manually trigger a ticket email.
class ResendTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        registration = get_object_or_404(Registration, id = ticket_id, student__user = request.user, is_cancelled = False)

        transaction.on_commit(lambda: send_ticket_email.delay(str(registration.id)))

        return Response({'message' : "Ticket sent to your email!"}, status = 200)
    

# Scans a QR code. Verifies signature. Checks user in.
class VerifyTicketView(APIView):

    permission_classes = [IsAuthenticated, IsHostUser]

    def post(self, request):
        token = request.data.get('token')
        ticket_code = request.data.get('ticket_code')
        event_id = request.data.get('event_id')

        registration_id = None  

        if token:
            try:
                # Ensures that the QR code wasn't forged by a student
                payload = jwt.decode(token, settings.TICKET_SIGNING_KEY, algorithms = ['HS256'])

                registration_id = payload.get('rid')
                token_event_id = payload.get('eid')

                if event_id and str(token_event_id) != str(event_id):

                    return Response({'error' : "This ticket belongs to a different event."}, status = 400)
            except jwt.ExpiredSignatureError:

                return Response({'error' : "Ticket has EXPIRED"}, status = 400)
            
            except jwt.InvalidTokenError:

                return Response({'error' : "INVALID TICKET. Please check again."}, status = 400)
        elif ticket_code:
            if not event_id:

                return Response({'error' : "Event ID is required for manual entry."}, status = 400)
            
            try:
                registration_id = Registration.objects.values_list('id', flat = True).get(ticket_code__iexact = ticket_code, event_id = event_id)
            except Registration.DoesNotExist:

                return Response({'error' : "Invalid ticket code for this event."}, status = 404)
        else:

            return Response({'error' : "No ticket token or code provided."}, status = 400)

        # Try to check in ONLY if currently checked out. This returns the number of rows modified.
        rows_updated = Registration.objects.filter(
            id = registration_id,
            event_id = event_id,
            is_checked_in = False,
            is_cancelled = False,
        ).update(
            is_checked_in = True,
            checked_in_at = timezone.now()
        )

        if rows_updated == 1:
            registration = Registration.objects.get(id = registration_id)

            school_college_display = 'N/A'

            if registration.guest_data and 'school_college_name'in registration.guest_data:
                school_college_display = registration.guest_data['school_college_name']
            elif registration.student.school_college:
                school_college_display = f"{registration.student.school_college.name} ({registration.student.school_college.city})"

            return Response({
                'status' : 'success',
                'message' : "VALID TICKET",
                'attendee' : {
                    'name' : registration.attendee_name,
                    'email' : registration.email,
                    'college' : school_college_display,
                    'student_id' : registration.guest_data.get('student_id_number', registration.student.student_id_number or 'N/A') ,
                },
                'event' : registration.event.name,
            }, status = 200)
        
        try:
            # Failure case : The update failed. Why? Now we check the DB for a specific error message.
            registration = Registration.objects.get(id = registration_id, event_id = event_id)

            if registration.checked_in:

                return Response({
                    'status' : 'warning',
                    'message' : "ALREADY CHECKED IN",
                    'time' : registration.checked_in_at,
                    'attendee' : registration.attendee_name
                }, status = 200)
            
            if registration.is_cancelled:

                return Response({'error' : "Ticket is CANCELLED."}, status = 400)

        except Registration.DoesNotExist:

            return Response({'error' : "Ticket was not found in system."}, status = 404)
        
        return Response({'error' : "Unable to verify ticket."}, status = 400)
        

# --- Dropdown Data Views ---
# Public endpoint to fetch all categories
class CategoryListView(generics.ListAPIView):

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


# Public endpoint to fetch all supported colleges for the signup dropdown.
class SchoolCollegeListView(generics.ListAPIView):

    serializer_class = SchoolCollegeSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Since it's a dropdown, the frontend should get the full list at once. Or else, it'll send some at once & won't show the others.

    def get_queryset(self):
        queryset = SchoolCollege.objects.all()
        search_query = self.request.query_params.get('search', None) # Grabs search parameter from URL
        
        if search_query:
            # Search by name or city (case-insensitive)
            return queryset.filter(
                Q(name__icontains = search_query) |
                Q(city__icontains = search_query)
            )[:20] # Limits to 20 results for speed
        
        # Returns top 20 by default so dropdown isn't empty
        return queryset[:20] 
