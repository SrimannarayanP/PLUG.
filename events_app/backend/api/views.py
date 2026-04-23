# views.py


from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, Event, EventClick, Registration, SchoolCollege
from .permissions import IsEmailVerified, IsEventOwner, IsHostUser
from .serializers import (
    AttendeeListSerializer, BulkRegistrationSerializer, CategorySerializer, CustomTokenObtainPairSerializer, EventSerializer, RegistrationSerializer,
    SetNewPasswordSerializer, UserSerializer
)
from .services.auth_service import AuthService
from .services.event_management_service import EventManagementService
from .services.host_service import HostService
from .services.payment_service import PaymentService
from .services.registration_service import EventRegistrationService
from .services.ticket_service import TicketService
from .services.user_service import UserService
from .tasks import send_ticket_email

import logging, json, razorpay


User = get_user_model()

logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class DeleteEventDocumentView(APIView):
    
    permission_classes = [IsAuthenticated, IsHostUser]

    def delete(self, request, doc_id):
        try:
            EventManagementService.delete_document(request.user, doc_id)

            return Response(status = 204)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 403)

# --- Auth & User Views ---
class CustomTokenObtainPairView(TokenObtainPairView):

    serializer_class = CustomTokenObtainPairSerializer


class CreateUserView(APIView):

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserSerializer(data = request.data)

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)

        try:
            user = UserService.register_user(serializer.validated_data)

            return Response(UserSerializer(user).data, status = 201)
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")

            return Response({'error' : "An error occurred during registration."}, status = 500)
        

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

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)

        try:
            user = UserService.update_profile(request.user, serializer.validated_data)

            return Response(UserSerializer(user).data)
        except Exception as e:
            logger.error(f"Profile update failed: {str(e)}")

            return Response({'error' : "An error occurred updating the profile."}, status = 500)


class DeleteUserView(APIView):

    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            UserService.delete_account(request.user)

            return Response(status = 204)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)


class RequestPasswordResetView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)

        AuthService.request_password_reset(email)
        
        return Response({'message' : "If an account exists, a reset link has been sent."}, status = 200)


class SetNewPasswordView(generics.GenericAPIView):

    permission_classes = [AllowAny]

    # Sends the data to the serializer to be validated. If it is validated, it'll tell to save. Else it'll raise error. 
    def post(self, request):
        serializer = SetNewPasswordSerializer(data = request.data)

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)
        
        try:
            AuthService.set_new_password(
                uid_b64 = serializer.validated_data['uid'], token = serializer.validated_data['token'], new_password = serializer.validated_data['password']
            )

            return Response({'message' : "Password reset successfully. You can now login."}, status = 200)
        except ValueError as e:
        
            return Response({'error' : str(e)}, status = 400)
        

# --- Email Verification Views ---
class VerifyEmailOTPView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp_input = request.data.get('otp')

        if not otp_input:

            return Response({'error' : "OTP is required."}, status = 400)
        
        try:
            message = AuthService.verify_email_otp(request.user, otp_input)

            return Response({'message' : message}, status = 200)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)


class ResendOTPView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            message = AuthService.resend_otp(request.user)

            return Response({'message' : message}, status = 200)
        except ValueError as e:
            error_msg = str(e)

            if error_msg.startswith("RATE LIMIT:"):

                return Response({'error' : error_msg.replace("RATE LIMIT:", '')}, status = 429)

            return Response({'error' : error_msg}, status = 400)


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
        # Deserializing the data (Converting it back into the respective object type)
        serializer = EventSerializer(data = request.data) # We get the raw data from the request & pass it to the serializer. The serializer than maps this raw data to
                                                    # the 'Event' model fields.

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)
        
        is_internal_event = str(request.data.get('is_internal_event', '')).lower() == 'true'
        requested_ids = request.data.getlist('restricted_to_school_college_ids')

        try:
            event = EventManagementService.create_event(
                user = request.user,
                validated_data = serializer.validated_data,
                is_internal_event = is_internal_event,
                requested_school_college_ids = requested_ids
            )

            return Response(EventSerializer(event).data, status = 201)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)
                                                                

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


class HostEventUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Allows the host to get event details (to edit them), update the details (rename event, add more files etc.) & delete the event."""

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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)        
        instance = self.get_object()

        serializer = self.get_serializer(instance, data = request.data, partial = partial)

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)
        
        is_internal_event = None

        if 'is_internal_event' in request.data:
            is_internal_event = str(request.data.get('is_internal_event', '')).lower() == 'true'

        requested_ids = request.data.getlist('restricted_to_school_college_ids')

        try:
            event = EventManagementService.update_event(
                event = instance, validated_data = serializer.validated_data, is_internal_event = is_internal_event, requested_school_college_ids = requested_ids
            )

            return Response(EventSerializer(event).data)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)


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
        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)
        
        try:
            message = HostService.add_team_member(request.user, club_id, email)

            return Response({'message' : message}, status = 200)
        except ValueError as e:
            status_code = 404 if "not found" in str(e).lower() else 400

            return Response({'error' : str(e)}, status = status_code)
    
    def delete(self, request, club_id):
        email = request.data.get('email')

        if not email:

            return Response({'error' : "Email is required."}, status = 400)

        try:
            message = HostService.remove_team_member(request.user, club_id, email)

            return Response({'message' : message}, status = 200)
        except ValueError as e:
            status_code = 404 if "User not found" in str(e) else 400

            return Response({'error' : str(e)}, status = status_code)


# --- Student & Ticket Views ---
class RegisterForEventView(APIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'ticket_checkout'

    def post(self, request, *args, **kwargs):
        event_id = request.data.get('event_id')

        serializer = BulkRegistrationSerializer(data = request.data)

        if not serializer.is_valid():

            return Response(serializer.errors, status = 400)
        
        try:
            result = EventRegistrationService.process_booking(user = request.user, event_id = event_id, attendees_data = serializer.validated_data['attendees'])
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)
        
        if result.get('requires_payment'):

            return Response({
                'message' : "Order created. Proceed to payment.",
                'razorpay_order_id' : result['razorpay_order_id'],
                'amount' : result['amount'],
                'razorpay_key' : settings.RAZORPAY_KEY_ID,
                'currency' : 'INR',
                'user_name' : f"{request.user.first_name} {request.user.last_name}".strip(),
                'user_email' : request.user.email,
                'user_phone' : request.user.student_profile.phone_number or ''
            }, status = 200)

        return Response({
            'message' : "Registration successful! Check your email.",
            'tickets' : result['tickets_created']
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
    

class ResendTicketView(APIView):
    """Manually trigger a ticket email."""

    permission_classes = [IsAuthenticated, IsEmailVerified]

    def post(self, request, ticket_id):
        registration = get_object_or_404(Registration, id = ticket_id, student__user = request.user, is_cancelled = False)

        transaction.on_commit(lambda: send_ticket_email.delay(str(registration.id)))

        return Response({'message' : "Ticket sent to your email!"}, status = 200)
    

class VerifyTicketView(APIView):
    """Scans a QR code. Verifies signature. Checks user in."""

    permission_classes = [IsAuthenticated, IsHostUser]

    def post(self, request):
        scanned_data = request.data.get('scanned_data')
        input_event_id = request.data.get('event_id')

        try:
            result = TicketService.verify_ticket(
                host_user = request.user,
                scanned_data = scanned_data,
                input_event_id = input_event_id
            )

            return Response(result, status = 200)
        except ValueError as e:
            
            return Response({'error' : str(e)}, status = 400)


class CancelTicketView(APIView):

    permission_classes = [IsAuthenticated, IsEmailVerified]

    def post(self, request, ticket_id):
        try:
            message = TicketService.cancel_ticket(user = request.user, ticket_id = ticket_id)

            return Response({'message' : message}, status = 200)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)
        

# --- Dropdown Data Views ---
class CategoryListView(generics.ListAPIView):
    """Public endpoint to fetch all categories"""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class SchoolCollegeListView(generics.ListAPIView):
    """Public endpoint to fetch all supported colleges for the signup dropdown."""

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

        official_results = list(official_queryset[:35].values('id', 'name', 'campus', 'city', 'state'))

        return Response(official_results)
    

# --- Payment & PG Related Views ---
class ProcessPaymentView(APIView):

    permission_classes = [IsAuthenticated, IsHostUser]

    def post(self, request):
        registration_id = request.data.get('registration_id')
        action = request.data.get('action')

        if action != 'refund':

            return Response({'error' : "Invalid action. Payments are verified automatically by the system."}, status = 400)
        
        try:
            PaymentService.initiate_manual_refund(user = request.user, registration_id = registration_id)

            return Response({'message' : "Refund initiated with the bank. Status will update automatically."}, status = 200)
        except ValueError as e:
            error_msg = str(e)
            status_code = 404 if "not found" in error_msg else 400

            return Response({'error' : error_msg}, status = status_code)
        

class VerifyRazorpayPaymentView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):

            return Response({'error' : "Missing payment parameters from Razorpay."}, status = 400)
        
        try:
            result = PaymentService.verify_payment(razorpay_payment_id, razorpay_order_id, razorpay_signature)

            if result['status'] == 'already_processed':

                return Response({'message' : "Payment already verified by the system.", 'tickets_processed' : 0}, status = 200)
            
            return Response({'message' : "Payment successful. Tickets verified & sent.", 'tickets_processed' : result['tickets_processed']}, status = 200)
        except ValueError as e:

            return Response({'error' : str(e)}, status = 400)
    

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
        
        try:
            payload_dict = json.loads(payload_body)
        except json.JSONDecodeError:
            
            return Response({'error' : "Invalid JSON payload."}, status = 400)
        
        # Drop duplicate webhooks using Razorpay's unique event ID header
        razorpay_event_id = request.headers.get('X-Razorpay-Event-Id')

        status = PaymentService.process_webhook(razorpay_event_id, payload_dict)

        if status == 'ignored':
            
            return Response({'status' : 'ignored', 'reason' : "already processed"}, status = 200)
        
        return Response({'status' : 'processed'}, status = 200)


class CancelPendingOrderView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')

        if not razorpay_order_id:

            return Response({'error' : "Order ID is required."}, status = 400)
        
        # Only touch pending tickets belonging to the logged-in user for this specific order.
        released_count = PaymentService.cancel_pending_order(request.user, razorpay_order_id)

        return Response({'message' : f"Released {released_count} pending tickets."}, status = 200)
