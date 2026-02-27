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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, Event, Registration, SchoolCollege, EventDocument
from .permissions import IsEmailVerified, IsEventOwner, IsHostUser
from .serializers import (AttendeeListSerializer, BulkRegistrationSerializer, CategorySerializer, CustomTokenObtainPairSerializer, EventSerializer, RegistrationSerializer,
                          SchoolCollegeSerializer, SetNewPasswordSerializer, UserSerializer)
from .tasks import send_password_reset_email, send_ticket_email, send_verification_email
from .utils import generate_otp, track_unlisted_school_college_request

import jwt, os

User = get_user_model()


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_event_document(request, doc_id):

    doc = get_object_or_404(EventDocument, id = doc_id)

    if doc.event.organisation.user != request.user:

        return Response({'error' : "Permission denied"}, status = 403)
    
    doc.delete()

    return Response(status = 204)

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
        data = request.data.copy()

        school_college_id = data.get('school_college_id')
        school_college_name = data.get('school_college_name', '').strip()

        if not school_college_id and school_college_name:
            school_college_city = data.get('school_college_city', '').strip()
            school_college_state = data.get('school_college_state', '').strip()

            if not school_college_city or not school_college_state:

                return Response({'school_college' : ["City & State are required for unlisted college."]}, status = 400)

            data['unlisted_school_college_data'] = {
                'name' : school_college_name,
                'campus' : data.get('school_college_campus', '').strip(),
                'city' : school_college_city,
                'state' : school_college_state
            }

        serializer = UserSerializer(request.user, data = data, partial = True) # Allows us to store only some fields instead of all

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

    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        return Event.objects.visible_to(self.request.user).select_related(
            'organisation', 'organisation__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('start_date')


# Basically, ye upcoming events dikhata hai. Abhi ka time aur 30 din baad ka time leke, unn dates ke beech me jo bhi events hai, unko return karegi ye view
class UpcomingEventListView(generics.ListAPIView):

    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.visible_to(self.request.user).filter(
            is_featured = False, start_date__gte = timezone.now()
        ).select_related(
            'organisation', 'organisation__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('start_date')

        category_id = self.request.query_params.get('category_id')

        if category_id:
            queryset = queryset.filter(categories__id = category_id)

        return queryset


class FeaturedEventListView(generics.ListAPIView):
    """Returns all the events that have is_featured = True for the Featured section of the website"""

    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        
        return Event.objects.visible_to(self.request.user).filter(
            is_featured = True, start_date__gte = timezone.now()
        ).select_related(
            'organisation', 'organisation__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('start_date')


class EventDetailsView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = EventSerializer
    permission_classes = [AllowAny] # This is to allow any un-logged in users to atleast see the event before registering.
    lookup_field = 'id'
    parser_classes = [FormParser, MultiPartParser] # Required for file uploads (poster/brochure)

    def get_queryset(self):

        return Event.objects.visible_to(self.request.user).select_related(
            'organisation', 'organisation__school_college'
        ).prefetch_related('restricted_to_schools_colleges')

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

            is_internal_event = str(request.data.get('is_internal_event', '')).lower() == 'true'
            is_paid_event = str(request.data.get('is_paid_event')).lower() == 'true'
            
            if is_paid_event:
                qr_path = os.path.join(settings.MEDIA_ROOT, 'platform_qr.jpg')

                if os.path.exists(qr_path):
                    # We open the file here but we pass it into save_kwargs
                    with open(qr_path, 'rb') as f:
                        django_file = File(f, name = 'platform_qr.jpg')
                        
                        save_kwargs['payment_qr_image'] = django_file

                        # Single save call
                        event = serializer.save(**save_kwargs)
                else:
                    event = serializer.save(**save_kwargs)
            else:
                # For free event
                event = serializer.save(**save_kwargs)

            if is_internal_event:
                host_school_college = user.organisation_profile.school_college

                if host_school_college:
                    event.restricted_to_schools_colleges.set([host_school_college])
                else:
                    requested_school_college_ids = request.data.getlist('restricted_to_school_college_ids')
                    
                    if requested_school_college_ids:
                        school_college = SchoolCollege.objects.filter(id__in = requested_school_college_ids)

                        event.restricted_to_schools_colleges.set(school_college)
                    else:
                        event.delete()

                        return Response({'restricted_to_school_college_ids' : ["External promoters must select a target college for internal events."]}, status = 400)

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

        return Event.objects.filter(organisation = user.organisation_profile).select_related(
            'organisation', 'organisation__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('-start_date')


class HostEventDetailView(APIView):
    """Returns stats & list of attendees for a specific event. Only hosts can access this."""

    permission_classes = [IsAuthenticated, IsHostUser]

    def get(self, request, event_id):
        user = request.user
        profile = user.organisation_profile

        event = get_object_or_404(Event, id = event_id, organisation = profile)
        
        # Attendee List (.select_related avoids the problem of running 100 SQL queries for 100 students)
        registrations = Registration.objects.filter(
            event = event, is_cancelled = False
        ).select_related(
            'student__user', 'student__school_college'
        ).order_by('-created_at')

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

            return Event.objects.filter(organisation = self.request.user.organisation_profile).select_related(
                'organisation', 'organisation__school_college'
            ).prefetch_related('restricted_to_schools_colleges')

        return Event.objects.none()
    
    def perform_update(self, serializer):
        user = self.request.user

        is_internal_event = str(self.request.data.get('is_internal_event', '')).lower() == 'true'

        event = serializer.save()

        if is_internal_event:
            host_school_college = user.organisation_profile.school_college

            if host_school_college:
                event.restricted_to_schools_colleges.set([host_school_college])
            else:
                requested_school_college_ids = self.request.data.getlist('restricted_to_school_college_ids', [])

                if requested_school_college_ids:
                    school_college = SchoolCollege.objects.filter(id__in = requested_school_college_ids)

                    event.restricted_to_schools_colleges.set(school_college)
                else:

                    raise ValidationError({'restricted_to_school_college_ids' : "External promoters must select a target college for internal events."})
        else:
            if 'is_internal_event' in self.request.data:
                event.restricted_to_schools_colleges.clear()


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
            school_college_id = buyer_data.get('school_college_id')
            school_college_name = buyer_data.get('school_college_name')

            if school_college_id:
                student_profile.school_college_id = school_college_id
                student_profile.unlisted_school_college_data = {} # Clear any unlisted data if they selected a valid college from the dropdown
                
                profile_updated = True
            elif school_college_name:
                unlisted_city = buyer_data.get('school_college_city', '').strip()
                unlisted_state = buyer_data.get('school_college_state', '').strip()

                if not unlisted_city or not unlisted_state:

                    return Response({'error' : "City & State are required for unlisted colleges."}, status = 400)

                unlisted_name = buyer_data.get('school_college_name').strip()
                unlisted_campus = buyer_data.get('school_college_campus', '').strip()

                student_profile.unlisted_school_college_data = {
                    'name' : unlisted_name,
                    'campus' : unlisted_campus,
                    'city' : unlisted_city,
                    'state' : unlisted_state
                }

                profile_updated = True

                track_unlisted_school_college_request(unlisted_name, unlisted_campus, unlisted_city, unlisted_state)

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
                    school_college_name_str = f"{sc.name} - {sc.campus} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"
                except SchoolCollege.DoesNotExist:
                    pass
            elif attendee.get('school_college_name'):
                raw_name = attendee.get('school_college_name').strip()
                raw_campus = attendee.get('school_college_campus', '').strip()
                raw_city = attendee.get('school_college_city', '').strip()
                raw_state = attendee.get('school_college_state', '').strip()

                if raw_campus:
                    school_college_name_str = f"{raw_name} - {raw_campus} ({raw_city})"
                else:
                    school_college_name_str = f"{raw_name} ({raw_city})"

                track_unlisted_school_college_request(raw_name, raw_campus, raw_city, raw_state)
            elif is_buyer and student_profile.school_college:
                sc = student_profile.school_college
                school_college_name_str = f"{sc.name} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"

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
            student__user = self.request.user, is_cancelled = False
        ).select_related(
            'event', # Fetches event details
            'event__organisation', # Fetches host details 
            'student__school_college' # Fetches college details
        ).order_by('-created_at')
    

# Manually trigger a ticket email.
class ResendTicketView(APIView):

    permission_classes = [IsAuthenticated, IsEmailVerified]

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
        input_event_id = request.data.get('event_id')

        registration_id = None
        token_event_id = None

        if token:
            try:
                # Ensures that the QR code wasn't forged by a student
                payload = jwt.decode(token, settings.TICKET_SIGNING_KEY, algorithms = ['HS256'])

                registration_id = payload.get('rid')
                token_event_id = payload.get('eid')

                if input_event_id and str(token_event_id) != str(input_event_id):

                    return Response({'error' : "This ticket belongs to a different event."}, status = 400)
            except jwt.ExpiredSignatureError:

                return Response({'error' : "Ticket has EXPIRED"}, status = 400)
            
            except jwt.InvalidTokenError:

                return Response({'error' : "INVALID TICKET. Please check again."}, status = 400)
        elif ticket_code:
            if not input_event_id:

                return Response({'error' : "Event ID is required for manual entry."}, status = 400)
            
            token_event_id = input_event_id
            
            try:
                registration_id = Registration.objects.values_list('id', flat = True).get(ticket_code__iexact = ticket_code, event_id = token_event_id)
            except Registration.DoesNotExist:

                return Response({'error' : "Registration does not exist for this event."}, status = 404)
        else:

            return Response({'error' : "No ticket token or code provided."}, status = 400)
        
        try:
            event = Event.objects.get(id = token_event_id)

            grace_period = timedelta(hours = 12)

            if timezone.now() > (event.end_date + grace_period):

                return Response({
                    'error' : "Event has ended. Ticket has expired.",
                    'event_ended_at' : event.end_date
                }, status = 400)
        except Event.DoesNotExist:

            return Response({'error' : "Event associated with this ticket not found."}, status = 404)

        # Try to check in ONLY if currently checked out. This returns the number of rows modified.
        rows_updated = Registration.objects.filter(
            id = registration_id, event_id = token_event_id, is_checked_in = False, is_cancelled = False, payment_status = Registration.PaymentStatus.VERIFIED
        ).update(
            is_checked_in = True, checked_in_at = timezone.now()
        )

        if rows_updated == 1:
            registration = Registration.objects.get(id = registration_id)

            school_college_display = 'N/A'

            if registration.guest_data and 'school_college_name' in registration.guest_data:
                school_college_display = registration.guest_data['school_college_name']
            elif registration.student.school_college:
                sc = registration.student.school_college

                school_college_display = f"{sc.name} - {sc.campus} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"

            dob = registration.guest_data.get('date_of_birth') or registration.student.date_of_birth

            return Response({
                'status' : 'success',
                'message' : "VALID TICKET",
                'attendee' : {
                    'name' : registration.attendee_name,
                    'email' : registration.email,
                    'school_college' : school_college_display,
                    'student_id_number' : registration.guest_data.get('student_id_number', registration.student.student_id_number or 'N/A') ,
                    'date_of_birth' : str(dob) if dob else None
                },
                'event' : registration.event.name,
            }, status = 200)
        
        try:
            # Failure case : The update failed. Why? Now we check the DB for a specific error message.
            registration = Registration.objects.get(id = registration_id, event_id = token_event_id)

            if registration.payment_status != Registration.PaymentStatus.VERIFIED:

                return Response({'error' : f"Ticket payment is {registration.get_}"})

            if registration.is_checked_in:

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
    

class CancelTicketView(APIView):

    permission_classes = [IsAuthenticated, IsEmailVerified]

    def post(self, request, ticket_id):
        ticket = get_object_or_404(Registration, id = ticket_id, student__user = request.user)

        if ticket.is_cancelled:

            return Response({'error' : "This ticket is already cancelled."}, status = 400)
        
        if ticket.event.start_date <= timezone.now():

            return Response({'error' : "Cannot cancel a ticket for an ongoing/past event."}, status = 400)
        
        if ticket.event.is_paid_event:
            if ticket.payment_status == Registration.PaymentStatus.VERIFIED:
                ticket.payment_status = Registration.PaymentStatus.REFUND_PENDING
                ticket.is_cancelled = True
                ticket.save()

                return Response({'message' : "Cancellation successful. Refund request sent to host."}, status = 200)
        elif ticket.payment_status == Registration.PaymentStatus.PENDING:
            ticket.payment_status = Registration.PaymentStatus.REJECTED
            ticket.is_cancelled = True
            ticket.save()

            return Response({'message' : "Ticket cancelled."}, status = 200)

        ticket.is_cancelled = True
        ticket.save()

        return Response({'message' : "Ticket cancelled successfully."}, status = 200)
        

# --- Dropdown Data Views ---
# Public endpoint to fetch all categories
class CategoryListView(generics.ListAPIView):

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


# Public endpoint to fetch all supported colleges for the signup dropdown.
class SchoolCollegeListView(generics.ListAPIView):
    
    permission_classes = [AllowAny]
    pagination_class = None # Since it's a dropdown, the frontend should get the full list at once. Or else, it'll send some at once & won't show the others.

    def list(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '').strip()

        official_queryset = SchoolCollege.objects.all()

        if search_query:
            official_queryset = official_queryset.filter(
                Q(name__icontains = search_query) |
                Q(campus__icontains = search_query) |
                Q(city__icontains = search_query)
            )

        official_results = list(official_queryset[:15].values('id', 'name', 'campus', 'city', 'state'))

        for item in official_results:
            item['status'] = 'verified'

        requested_results = []

        remaining_slots = 20 - len(official_results)

        if remaining_slots > 0:
            from .models import UnlistedSchoolCollege

            unlisted_queryset = UnlistedSchoolCollege.objects.all()

            if search_query:
                unlisted_queryset = unlisted_queryset.filter(
                    Q(name__icontains = search_query) |
                    Q(campus__icontains = search_query) |
                    Q(city__icontains = search_query)
                )

            unlisted_data = list(unlisted_queryset[:remaining_slots].values('name', 'campus', 'city', 'state', 'request_count'))

            for item in unlisted_data:
                item['id'] = None
                item['status'] = 'requested'

                requested_results.append(item)

        return Response(official_results + requested_results)
