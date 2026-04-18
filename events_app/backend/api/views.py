# views.py


from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.files import File
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, Event, EventClick, EventDocument, HostProfile, Registration, SchoolCollege
from .permissions import IsEmailVerified, IsEventOwner, IsHostUser
from .serializers import (AttendeeListSerializer, BulkRegistrationSerializer, CategorySerializer, CustomTokenObtainPairSerializer, EventSerializer,
                          RegistrationSerializer, SetNewPasswordSerializer, StudentProfileSerializer, UserSerializer)
from .tasks import initiate_mass_refunds, process_transaction_refund, send_password_reset_email, send_ticket_email, send_verification_email
from .utils import generate_otp, track_unlisted_school_college_request

import logging, hashlib, hmac, jwt, json, os, razorpay, uuid

User = get_user_model()

logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_event_document(request, doc_id):
    doc = get_object_or_404(EventDocument, id = doc_id)

    if not doc.event.host.users.filter(id = request.user.id).exists():

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
            logger.error(f"Failed to process password reset for {email}: {str(e)}")
        
        return Response({'message' : "If an account exists, a reset link has been sent."}, status = 200)


class SetNewPasswordView(generics.GenericAPIView):

    permission_classes = [AllowAny]
    serializer_class = SetNewPasswordSerializer

    # Sends the data to the serializer to be validated. If it is validated, it'll tell to save. Else it'll raise error. 
    def post(self, request):
        serializer = self.get_serializer(data = request.data)

        if serializer.is_valid():
            serializer.save()

            return Response({'message' : "Password reset successfully. You can now login."}, status = 200)
        
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
            'host', 'host__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('start_date')


# Basically, ye upcoming events dikhata hai. Abhi ka time aur 30 din baad ka time leke, unn dates ke beech me jo bhi events hai, unko return karegi ye view
class UpcomingEventListView(generics.ListAPIView):

    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.visible_to(self.request.user).filter(
            start_date__gte = timezone.now(), is_cancelled = False
        ).select_related(
            'host', 'host__school_college'
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
            is_featured = True, start_date__gte = timezone.now(), is_cancelled = False
        ).select_related(
            'host', 'host__school_college'
        ).prefetch_related('restricted_to_schools_colleges').order_by('start_date')


class EventDetailsView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = EventSerializer
    permission_classes = [AllowAny] # This is to allow any un-logged in users to atleast see the event before registering.
    lookup_field = 'id'
    parser_classes = [FormParser, MultiPartParser] # Required for file uploads (poster/brochure)

    def get_queryset(self):

        return Event.objects.visible_to(self.request.user).select_related(
            'host', 'host__school_college'
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

        serializer = EventSerializer(data = request.data)

        # This method runs all the rules defined in the 'Event' model & 'EventSerializer'. Are required fields present? Is the email valid? etc. It returns True if
        # everything is perfect, false if there is even 1 error.
        if serializer.is_valid():
            # The request.data does not contain the "Organisation ID" (because we don't trust the users to set it). We call .save() but we pass
            # "organisation = user.organisationprofile" as an argument. Toh pehle frontend se event ke poore details aa jaayenge, Django usse validate krega, agar
            # sab sahi rha, phir uss data me "Organisation ID" ko 'inject'/add karega. Phir usko backend me save karega.    
            host_profile = user.host_profiles.first()

            if not host_profile:

                return Response({'error' : "You do not manage any host profiles."}, status = 403)
            
            save_kwargs = {'host' : host_profile}

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
                host_school_college = host_profile.school_college

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

        return Event.objects.filter(host__in = user.host_profiles.all()).select_related(
            'host', 'host__school_college'
        ).prefetch_related('restricted_to_schools_colleges', 'registrations').order_by('-start_date')


class HostEventDetailView(APIView):
    """Returns stats & list of attendees for a specific event. Only hosts can access this."""

    permission_classes = [IsAuthenticated, IsHostUser]

    def get(self, request, id):
        user = request.user

        event = get_object_or_404(Event, id = id, host__in = user.host_profiles.all())
        
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
        stats = Registration.objects.filter(event = event).aggregate(
            total = Count('id', filter = Q(is_cancelled = False)),
            checked_in = Count('id', filter = Q(is_cancelled = False, is_checked_in = True))
        )

        attendee_serializer = AttendeeListSerializer(registrations, many = True)

        return Response({
            'event' : EventSerializer(event).data,
            'stats' : stats,
            'attendees' : attendee_serializer.data
        })


# Allows the host to get event details (to edit them), update the details (rename event, add more files etc.) & delete the event.
class HostEventUpdateView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsHostUser]
    parser_classes = [FormParser, JSONParser, MultiPartParser]
    lookup_field = 'id'

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.host_profiles.exists():

            return Event.objects.filter(host__in = self.request.user.host_profiles.all()).select_related(
                'host', 'host__school_college'
            ).prefetch_related('restricted_to_schools_colleges')

        return Event.objects.none()

    @transaction.atomic
    def perform_update(self, serializer):
        instance = self.get_object()
        was_cancelled = instance.is_cancelled

        becoming_cancelled = serializer.validated_data.get('is_cancelled', was_cancelled)

        if was_cancelled and not becoming_cancelled:

            return ValidationError({'is_cancelled' : "You cannot un-cancel an event once it has been cancelled & refunds are initiated."})
        
        if not was_cancelled and becoming_cancelled:
            if instance.start_date <= timezone.now():

                raise ValidationError({'is_cancelled' : "Cannot cancel an event that has already started or passed."})

        is_internal_event = str(self.request.data.get('is_internal_event', '')).lower() == 'true'

        event = serializer.save()

        if is_internal_event:
            host_school_college = event.host.school_college

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

        if becoming_cancelled and not was_cancelled:
            Registration.objects.filter(
                event = event,
                is_cancelled = False,
                payment_status = Registration.PaymentStatus.VERIFIED
            ).update(
                is_cancelled = True,
                payment_status = Registration.PaymentStatus.REFUND_PENDING
            )

            Registration.objects.filter(
                event = event,
                is_cancelled = False,
                payment_status = Registration.PaymentStatus.PENDING
            ).update(
                is_cancelled = True,
                payment_status = Registration.PaymentStatus.REJECTED
            )

            transaction.on_commit(lambda e_id = str(event.id): initiate_mass_refunds.delay(e_id))


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object() # Ensures event belongs to logged-in host before deletion.

        finances = instance.registrations.filter(
            payment_status__in = [
                Registration.PaymentStatus.VERIFIED,
                Registration.PaymentStatus.REFUND_PENDING,
                Registration.PaymentStatus.PENDING,
            ]
        ).exists()

        if instance.tickets_sold > 0:

            return Response({'error' : "Cannot delete an event with active tickets. You must cancel all registrations before deleting the event."}, status = 400)

        if finances:

            return Response({
                'error' : "Cannot delete this event. There are active, pending or un-refunded tickets attached to it. Process all refunds & reject pending payments first."
            }, status = 400)

        self.perform_destroy(instance)

        return Response({'event' : "Event deleted successfully."}, status = 204)
    

class TrackEventClickView(APIView):

    permission_classes = [AllowAny]

    def post(self, request, id):
        event = get_object_or_404(Event, id = id)
        user = request.user if request.user.is_authenticated else None

        EventClick.objects.create(event = event, user = user)

        return Response({'status' : 'tracked'}, status = 200)


# --- Team Management Views ---
class ClubTeamManagementView(APIView):
    """Allows owner to add/remove members related to club"""

    permission_classes = [IsAuthenticated, IsHostUser, IsEmailVerified]

    def post(self, request, club_id):
        host_profile = get_object_or_404(HostProfile, id = club_id, owner = request.user)

        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)
        
        try:
            target_user = User.objects.get(email__iexact = email.strip())
        except User.DoesNotExist:

            return Response({'error' : "Student not found. They must sign up for PLUG first."}, status = 404)
        
        if host_profile.users.filter(id = target_user.id).exists():

            return Response({'error' : "User is already on the team."}, status = 200)

        host_profile.users.add(target_user)

        return Response({'message' : f"Added {target_user.first_name} to the team."}, status = 200)
    
    def delete(self, request, club_id):
        host_profile = get_object_or_404(HostProfile, id = club_id, owner = request.user)

        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)

        try:
            target_user = User.objects.get(email__iexact = email.strip())
        except User.DoesNotExist:

            return Response({'error' : "User not found."}, status = 404)
        
        if target_user == host_profile.owner:

            return Response({'error' : "You cannot remove the founder from the team."}, status = 400)
        
        host_profile.users.remove(target_user)

        return Response({'message' : f"Removed {target_user.first_name} from the team."}, status = 200)



class ProcessPaymentView(APIView):

    permission_classes = [IsAuthenticated, IsHostUser]

    @transaction.atomic
    def post(self, request):
        user = request.user

        registration_id = request.data.get('registration_id')
        action = request.data.get('action')

        if action not in ['refund']:

            return Response({'error' : "Invalid action. Payments are verified automatically by the system."}, status = 400)
        
        try:
            # We filter by the registration ID & the organisation linked to the logged-in host. This prevents hackers from approving tickets for other people's events.
            registration = Registration.objects.select_for_update().get(id = registration_id, event__host__in = user.host_profiles.all()) 
                                                                                                                                        # Checks if event belongs to host
        except Registration.DoesNotExist:

            return Response({'error' : "Registration not found or authorized."}, status = 404)
        
        # Handle rejection
        if action == 'refund':
            if registration.payment_status != Registration.PaymentStatus.REFUND_PENDING:

                return Response({'error' : "Ticket is not pending a refund."}, status = 400)
            
            # We don't mark as processed here. We'll use the webhook for that.
            transaction.on_commit(lambda pid = registration.razorpay_payment_id: process_transaction_refund.delay(pid))

            return Response({'message' : "Refund initiated with the bank. Status will update automatically."}, status = 200)


# --- Student & Ticket Views ---
class RegisterForEventView(APIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'ticket_checkout'

    def post(self, request, *args, **kwargs):
        event_id = request.data.get('event_id')

        if not event_id:

            return Response({'error' : "event_id is required."}, status = 400)
        
        try:
            uuid.UUID(str(event_id))
        except ValueError:

            return Response({'error' : "Invalid event_id format."}, status = 400)
        
        try:
            event = Event.objects.get(id = event_id)
        except Event.DoesNotExist:

            return Response({'error' : "Event not found."}, status = 404)
        
        Registration.objects.filter(
            student = request.user.student_profile,
            event = event,
            payment_status = Registration.PaymentStatus.PENDING,
            is_cancelled = False
        ).update(
            is_cancelled = True,
            payment_status = Registration.PaymentStatus.REJECTED
        )
        
        # Deadline check
        if not event.is_registration_open:

            return Response({'error' : f"Registration for this event closed on {event.registration_deadline.strftime(r"%d %b, %I:%M %p")}."}, status = 400)
        
        serializer = BulkRegistrationSerializer(data = request.data, context = {'request' : request, 'locked_event' : event})

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)

        data = serializer.validated_data
        attendees = data['attendees']
        
        user = request.user
        student_profile = user.student_profile

        buyer_data = attendees[0]

        profile_updates = {}

        # Phone check
        if event.collect_phone and not student_profile.phone_number:
            profile_updates['phone_number'] = buyer_data.get('phone_number')

        # College check
        if event.collect_college_school and not student_profile.school_college:
            school_college_id = buyer_data.get('school_college_id')
            school_college_name = buyer_data.get('school_college_name')

            if school_college_id:
                profile_updates['school_college'] = school_college_id
                profile_updates['unlisted_school_college_data'] = {} # Clear any unlisted data if they selected a valid college from the dropdown
            elif school_college_name:
                unlisted_city = buyer_data.get('school_college_city', '').strip()
                unlisted_state = buyer_data.get('school_college_state', '').strip()

                profile_updates['unlisted_school_college_data'] = {
                    'name' : buyer_data.get('school_college_name').strip(),
                    'campus' : buyer_data.get('school_college_campus', '').strip(),
                    'city' : unlisted_city,
                    'state' : unlisted_state
                }

        # Student ID check
        if event.collect_student_id and not student_profile.student_id_number:
            profile_updates['student_id_number'] = buyer_data.get('student_id_number')

        if event.age_restriction_cutoff and not student_profile.date_of_birth:
            dob = buyer_data.get('date_of_birth')

            if dob:
                profile_updates['date_of_birth'] = dob

        profile_serializer = None
        # Save the new data if we found any.
        if profile_updates:
            profile_serializer = StudentProfileSerializer(student_profile, data = profile_updates, partial = True)

            if not profile_serializer.is_valid():

                return Response({
                    'error' : "Invalid profile data provided.",
                    'details' : profile_serializer.errors
                }, status = 400)
            
        total_attendees = len(attendees)
        total_amount_rupees = float(event.ticket_price) * total_attendees
        total_amount_paise = int(total_amount_rupees * 100)

        razorpay_order = None

        if event.is_paid_event:
            try:
                order_data = {
                    'amount' : total_amount_paise,
                    'currency' : 'INR',
                    'receipt' : f"rcpt_{user.id}_{uuid.uuid4().hex[:8]}",
                    'payment_capture' : 1
                }

                razorpay_order = razorpay_client.order.create(data = order_data)
            except Exception as e:
                logger.error(f"Razorpay Order Creation Failed: {str(e)}")

                return Response({'error' : "Payment Gateway is currently down. Try again later."}, status = 503)

        with transaction.atomic():
            locked_event = Event.objects.select_for_update().get(id = event_id)

            if locked_event.capacity is not None:
                if total_attendees > locked_event.remaining_capacity:

                    return Response({'error' : f"Only {locked_event.remaining_capacity} tickets remaining."}, status = 400)

            if profile_serializer:
                profile_serializer.save()

            created_registrations = []
            
            for i, attendee in enumerate(attendees):
                is_buyer = (i == 0)

                reg_email = user.email if is_buyer else attendee.get('email', user.email)
                reg_first_name = user.first_name if is_buyer else attendee.get('first_name', 'Guest')
                reg_last_name = user.last_name if is_buyer else attendee.get('last_name', '')

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

                    school_college_name_str = f"{raw_name} - {raw_campus} ({raw_city})" if raw_campus else f"{raw_name} ({raw_city})"

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
                    event = locked_event,
                    email = reg_email,
                    first_name = reg_first_name,
                    last_name = reg_last_name,
                    guest_data = guest_extra_info,
                    is_cancelled = False,
                    payment_status = Registration.PaymentStatus.PENDING if locked_event.is_paid_event else Registration.PaymentStatus.VERIFIED,
                    razorpay_order_id = razorpay_order['id'] if locked_event.is_paid_event else None
                )

                created_registrations.append(registration)

        # Handling payment state
        if event.is_paid_event:

            return Response({
                'message' : "Order created. Proceed to payment.",
                'razorpay_order_id' : razorpay_order['id'],
                'razorpay_key' : settings.RAZORPAY_KEY_ID,
                'amount' : total_amount_rupees,
                'currency' : 'INR',
                'user_name' : f"{user.first_name} {user.last_name}".strip(),
                'user_email' : user.email,
                'user_phone' : student_profile.phone_number or ''
            }, status = 200)

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
            student__user = self.request.user
        ).select_related(
            'event', # Fetches event details
            'event__host', # Fetches host details
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
            event = Event.objects.get(id = token_event_id, host__in = request.user.host_profiles.all())

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

                return Response({'error' : f"Ticket payment is {registration.get_payment_status_display().upper()}."}, status = 400)

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

        time_until_event = ticket.event.start_date - timezone.now()

        if time_until_event <= timedelta(hours = 24):

            return Response({'error' : "Cancellations are strictly prohibited within 24 hours of the event start time."}, status = 400)
        
        if ticket.event.start_date <= timezone.now():

            return Response({'error' : "Cannot cancel a ticket for an ongoing/past event."}, status = 400)
        
        if ticket.event.is_paid_event:
            if ticket.payment_status == Registration.PaymentStatus.VERIFIED:
                ticket.payment_status = Registration.PaymentStatus.REFUND_PENDING
                ticket.is_cancelled = True
                ticket.save()

                transaction.on_commit(lambda pid = ticket.razorpay_payment_id: process_transaction_refund.delay(pid))

                return Response({'message' : "Cancellation successful. Refund processing initiated with the bank."}, status = 200)
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

        official_queryset = SchoolCollege.objects.all().order_by('name')

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
    

# --- Payment & PG Related Views ---
class VerifyRazorpayPaymentView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):

            return Response({'error' : "Missing payment parameters from Razorpay."}, status = 400)
        
        params_dict = {
            'razorpay_order_id' : razorpay_order_id,
            'razorpay_payment_id' : razorpay_payment_id,
            'razorpay_signature' : razorpay_signature
        }

        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            logger.critical(f"Forge attempt detected for order {razorpay_order_id}")

            return Response({'error' : "Payment verification failed. Invalid signature."}, status = 400)
        
        with transaction.atomic():
            registrations = Registration.objects.select_for_update().filter(
                razorpay_order_id = razorpay_order_id,
                is_cancelled = False
            )

            if not registrations.exists():

                return Response({'error' : "Order not found."}, status = 400)
            
            pending_registrations = registrations.filter(payment_status = Registration.PaymentStatus.PENDING)
            
            # If no tickets are pending, check if they are verified.
            if not pending_registrations.exists():
                if registrations.filter(payment_status = Registration.PaymentStatus.VERIFIED).exists():

                    # Webhook beat the frontend. Tell the frontend, it's a success.
                    return Response({
                        'message' : "Payment already verified by the system.",
                        'tickets_processed' : 0
                    }, status = 200)

                return Response({'error' : "Order already processed or in an invalid state."}, status = 400)

            processed_count = 0

            for reg in pending_registrations:
                reg.payment_status = Registration.PaymentStatus.VERIFIED
                reg.razorpay_payment_id = razorpay_payment_id
                reg.razorpay_signature = razorpay_signature
                reg.save()

                transaction.on_commit(lambda r = reg: send_ticket_email.delay(str(r.id)))

                processed_count += 1

        return Response({
            'message' : "Payment successful. Tickets verified & sent.",
            'tickets_processed' : processed_count
        }, status = 200)
    

class RazorpayWebhookView(APIView):

    permission_classes = [AllowAny]
    
    def post(self, request, *arg, **kwargs):
        payload_body = request.body.decode('utf-8')
        signature_header = request.headers.get('X-Razorpay-Signature')

        if not signature_header:

            return Response({'error' : "Missing signature"}, status = 400)
        
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None)

        if not webhook_secret:
            logger.critical("RAZORPAY_WEBHOOK_SECRET is not set in Django settings.")

            return Response({'error' : "Server misconfig."}, status = 500)
        
        try:
            razorpay_client.utility.verify_webhook_signature(payload_body, signature_header, webhook_secret)
        except razorpay.errors.SignatureVerificationError:
            logger.warning("Invalid Razorpay webhook signature detected.")

            return Response({'error' : "Invalid signature"}, status = 400)
        
        # Drop duplicate webhooks using Razorpay's unique event ID header
        razorpay_event_id = request.headers.get('X-Razorpay-Event-Id')

        if razorpay_event_id and cache.get(f"webhook_processed_{razorpay_event_id}"):
            logger.info(f"Duplicate webhook {razorpay_event_id} ignored.")

            return Response({'status' : 'ignored', 'reason' : "already processed"}, status = 200)
        
        try:
            payload_dict = json.loads(payload_body)
        except json.JSONDecodeError:

            return Response({'error' : "Invalid JSON payload."}, status = 400)
        
        event_name = payload_dict.get('event')

        if event_name == 'payment.captured':
            payment_entity = payload_dict['payload']['payment']['entity']
            razorpay_payment_id = payment_entity['id']
            razorpay_order_id = payment_entity['order_id']

            with transaction.atomic():
                # Lock the table so that Celery can't modify at the same time.
                registrations = Registration.objects.select_for_update().filter(razorpay_order_id = razorpay_order_id)

                if not registrations.exists():
                    logger.error(f"Webhook received for unknown order: {razorpay_order_id}")

                    return Response({'status' : 'ignored'}, status = 200)
                
                # Check if any ticket in this order is cancelled before looping.
                cancelled_registrations = registrations.filter(
                    is_cancelled = True,
                    payment_status__in = [Registration.PaymentStatus.PENDING, Registration.PaymentStatus.REJECTED]
                )
                pending_valid_registrations = registrations.filter(is_cancelled = False, payment_status = Registration.PaymentStatus.PENDING)

                if cancelled_registrations.exists():
                    refund_amount_rupees = sum([reg.event.ticket_price for reg in cancelled_registrations])
                    refund_amount_paise = int(refund_amount_rupees * 100)

                    logger.info(f"Late payment detected for cancelled order {razorpay_order_id}. Initiating auto-refund ONCE.")

                    try:
                        razorpay_client.payment.refund(razorpay_payment_id, {'amount' : refund_amount_paise})

                        cancelled_registrations.update(
                            payment_status = Registration.PaymentStatus.REFUND_PROCESSED,
                            razorpay_payment_id = razorpay_payment_id
                        )
                    except Exception as e:
                        logger.error(f"Auto-refund failed for payment {razorpay_payment_id}: {str(e)}")

                for reg in pending_valid_registrations:
                    reg.payment_status = Registration.PaymentStatus.VERIFIED
                    reg.razorpay_payment_id = razorpay_payment_id
                    reg.save()

                    transaction.on_commit(lambda r = reg: send_ticket_email.delay(str(r.id)))
        elif event_name == 'refund.processed':
            refund_entity = payload_dict['payload']['refund']['entity']
            razorpay_payment_id = refund_entity['payment_id']

            with transaction.atomic():
                # Lock all pending refund tickets tied to this specific Razorpay transaction
                pending_refunds = Registration.objects.select_for_update().filter(
                    razorpay_payment_id = razorpay_payment_id,
                    payment_status = Registration.PaymentStatus.REFUND_PENDING
                )

                if pending_refunds.exists():
                    # The bank has confirmed the money moved. Officially close the loop.
                    updated_count = pending_refunds.update(payment_status = Registration.PaymentStatus.REFUND_PROCESSED)

                    logger.info(f"Successfully marked {updated_count} tickets as REFUND_PROCESSED for payment {razorpay_payment_id}.")
                else:
                    logger.warning(f"Received refund.processed for {razorpay_payment_id} but no pending tickets found.")
        
        if razorpay_event_id:
            cache.set(f"webhook_processed_{razorpay_event_id}", True, timeout = 86400)

        return Response({'status' : 'processed'}, status = 200)


class CancelPendingOrderView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')

        if not razorpay_order_id:

            return Response({'error' : "Order ID is required."}, status = 400)
        
        # Only touch pending tickets belonging to the logged-in user for this specific order.
        released_count = Registration.objects.filter(
            student__user = request.user,
            razorpay_order_id = razorpay_order_id,
            payment_status = Registration.PaymentStatus.PENDING,
            is_cancelled = False
        ).update(
            is_cancelled = True,
            payment_status = Registration.PaymentStatus.REJECTED
        )

        return Response({'message' : f"Released {released_count} pending tickets."}, status = 200)
