# ticket_service.py


from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from api.models import Event, Registration
from api.tasks import process_transaction_refund

import logging


logger = logging.getLogger(__name__)


class TicketService:

    @staticmethod
    def verify_ticket(host_user, scanned_data, input_event_id = None):
        if not scanned_data:

            raise ValueError("No ticket data provided.")
        
        if not input_event_id:

            raise ValueError("Event ID is required for scanner operation.")
        
        try:
            registration_id = Registration.objects.values_list('id', flat = True).get(ticket_code__iexact = str(scanned_data).strip(), event_id = input_event_id)
        except Registration.DoesNotExist:

            raise ValueError("Registration does not exist for this event.")
        
        try:
            event = Event.objects.get(id = input_event_id, host__in = host_user.host_profiles.all())
            
            grace_period = timedelta(hours = 12)

            if timezone.now() > (event.end_date + grace_period):

                raise ValueError(f"Event ended at {event.end_date.strftime("%d %b, %I:%M %p")}. Ticket expired.")
        except Event.DoesNotExist:

            raise ValueError("Event associated with this ticket not found or unauthorized.")
        
        rows_updated = Registration.objects.filter(
            id = registration_id,
            event_id = input_event_id,
            is_checked_in = False,
            is_cancelled = False,
            payment_status = Registration.PaymentStatus.VERIFIED
        ).update(is_checked_in = True, checked_in_at = timezone.now())

        if rows_updated == 1:
            reg = Registration.objects.select_related('student', 'student__school_college', 'event').get(id = registration_id)

            school_college_display = 'N/A'

            if reg.guest_data and 'school_college_name' in reg.guest_data:
                school_college_display = reg.guest_data['school_college_name']
            elif reg.student.school_college:
                sc = reg.student.school_college
                school_college_display = f"{sc.name} - {sc.campus} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"

            dob = reg.guest_data.get('date_of_birth') or reg.student.date_of_birth

            return {
                'status' : 'success',
                'message' : "VALID TICKET",
                'attendee' : {
                    'name' : reg.attendee_name,
                    'email' : reg.email,
                    'school_college' : school_college_display,
                    'student_id_number' : reg.guest_data.get('student_id_number', reg.student.student_id_number or 'N/A'),
                    'date_of_birth' : str(dob) if dob else None
                },
                'event' : event.name
            }
        
        try:
            reg = Registration.objects.get(id = registration_id, event_id = input_event_id)

            if reg.payment_status != Registration.PaymentStatus.VERIFIED:

                raise ValueError(f"Ticket payment is {reg.get_payment_status_display().upper()}")
            
            if reg.is_checked_in:

                return {
                    'status' : 'warning',
                    'message' : "ALREADY CHECKED IN",
                    'time' : reg.checked_in_at,
                    'attendee' : reg.attendee_name
                }
            
            if reg.is_cancelled:
                
                raise ValueError("Ticket is CANCELLED.")
        except Registration.DoesNotExist:

            raise ValueError("Ticket was not found in system.")
        
        raise ValueError("Unable to verify ticket due to an unknown system state.")
    
    @staticmethod
    @transaction.atomic
    def cancel_ticket(user, ticket_id):
        try:
            # Lock to prevent race conditions with Razorpay webhook.
            ticket = Registration.objects.select_for_update().select_related('event').get(id = ticket_id, student__user = user)
        except Registration.DoesNotExist:

            raise ValueError("Ticket not found.")
        
        if ticket.is_cancelled:

            raise ValueError("This ticket is already cancelled.")
        
        time_until_event = ticket.event.start_date - timezone.now()

        if time_until_event <= timedelta(hours = 24):

            raise ValueError("Cancellations are strictly prohibited within 24 hours of the event start time.")
        
        if ticket.event.start_date <= timezone.now():

            raise ValueError("Cannot cancel a ticket for an ongoing/past event.")
        
        if ticket.event.is_paid_event:
            if ticket.payment_status == Registration.PaymentStatus.VERIFIED:
                ticket.payment_status = Registration.PaymentStatus.REFUND_PENDING
                ticket.is_cancelled = True
                ticket.save(update_fields = ['payment_status', 'is_cancelled'])

                transaction.on_commit(lambda pid = ticket.razorpay_payment_id: process_transaction_refund.delay(pid))

                return "Cancellation successful. Refund processing initiated with the bank."
            elif ticket.payment_status == Registration.PaymentStatus.PENDING:
                ticket.payment_status = Registration.PaymentStatus.REJECTED
                ticket.is_cancelled = True
                ticket.save(update_fields = ['payment_status', 'is_cancelled'])

                return "Ticket cancelled."
        
        ticket.is_cancelled = True
        ticket.save(update_fields = ['is_cancelled'])

        return "Ticket cancelled successfully."
