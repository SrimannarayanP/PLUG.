# registration_service.py


from django.conf import settings
from django.db import transaction

from api.models import Event, Registration, SchoolCollege
from api.tasks import send_ticket_email
from api.utils import track_unlisted_school_college_request

import logging, razorpay, uuid


logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class EventRegistrationService:

    @staticmethod
    def process_booking(user, event_id, attendees_data):
        """
            Handles the entire business logic for booking tickets. Returns a dict with success status, tickets or payment required. Raises ValueError for any business
            rule violation.
        """
        total_attendees = len(attendees_data)
        student_profile = user.student_profile
        buyer_data = attendees_data[0]

        try:
            event = Event.objects.get(id = event_id)
        except Event.DoesNotExist:

            raise ValueError("Event not found.")
        
        if not event.is_registration_open:

            raise ValueError(f"Registration closed on {event.registration_deadline.strftime("%d %b, %I:%M %p")}.")
        
        if event.capacity is not None and total_attendees > event.remaining_capacity:

            raise ValueError(f"Only {event.remaining_capacity} tickets remaining.")
        
        total_amount_rupees = float(event.ticket_price) * total_attendees
        razorpay_order = None

        if event.is_paid_event:
            try:
                order_data = {
                    'amount' : int(total_amount_rupees * 100),
                    'currency' : 'INR',
                    'receipt' : f'rcpt_{user.id}_{uuid.uuid4().hex[:8]}',
                    'payment_capture' : 1
                }

                razorpay_order = razorpay_client.order.create(data = order_data)
            except Exception as e:
                logger.error(f"Razorpay Order Creation Failed: {str(e)}")

                raise ValueError("Payment Gateway is currently down. Try again later.")

        with transaction.atomic():
            locked_event = Event.objects.select_for_update().get(id = event_id)
            
            if locked_event.capacity is not None and total_attendees > locked_event.remaining_capacity:

                    raise ValueError(f"Only {locked_event.remaining_capacity} tickets left.")
                
            internal_colleges = locked_event.restricted_to_schools_colleges.all()

            if internal_colleges.exists():
                if not student_profile.school_college or student_profile.school_college not in internal_colleges:
                    allowed = ", ".join([f"{sc.name} - {sc.campus}" if sc.campus else sc.name for sc in internal_colleges])

                    raise ValueError(f"This event is strictly internal to: {allowed}.")
                
            existing_active_regs = Registration.objects.filter(event = locked_event, is_cancelled = False)
            db_emails = set([e.lower().strip() for e in existing_active_regs.values_list('email', flat = True) if e])

            attendee_emails = set([a.get('email').lower().strip() for a in attendees_data if a.get('email')])

            if not attendee_emails and user.email:
                attendee_emails.add(user.email.lower().strip())

            email_overlap = attendee_emails.intersection(db_emails)

            if email_overlap:
                duplicates = ", ".join(email_overlap)

                raise ValueError(f"Tickets are already registered for these emails: {duplicates}")
                
            user_existing_tickets = Registration.objects.filter(student = student_profile, event = locked_event, is_cancelled = False).count()

            if user_existing_tickets + total_attendees > locked_event.max_tickets_per_user:
                remaining = locked_event.max_tickets_per_user - user_existing_tickets

                if remaining == 0:
                    
                    raise ValueError(f"You have reached the maximum limit of {locked_event.max_tickets_per_user} tickets for this event.")

                raise ValueError(f"You already hold {user_existing_tickets} ticket(s). You can only book {remaining} more.")
            
            profile_needs_save = False
            
            if locked_event.collect_phone and not student_profile.phone_number:
                student_profile.phone_number = buyer_data.get('phone_number')
                
                profile_needs_save = True

            if locked_event.collect_student_id and not student_profile.student_id_number:
                student_profile.student_id_number = buyer_data.get('student_id_number')

                profile_needs_save = True

            if locked_event.age_restriction_cutoff and not student_profile.date_of_birth:
                dob = buyer_data.get('date_of_birth')

                if dob:
                    student_profile.date_of_birth = dob
                    
                    profile_needs_save = True

            if locked_event.collect_college_school and not student_profile.school_college:
                sc_id = buyer_data.get('school_college_id')
                sc_name = buyer_data.get('school_college_name')

                if sc_id:
                    try:
                        student_profile.school_college = SchoolCollege.objects.get(id = sc_id)
                        student_profile.unlisted_school_college_data = {}
                        
                        profile_needs_save = True
                    except SchoolCollege.DoesNotExist:
                        pass
                elif sc_name:
                    unlisted_city = buyer_data.get('school_college_city', '').strip()
                    unlisted_state = buyer_data.get('school_college_state', '').strip()
                    
                    student_profile.unlisted_school_college_data = {
                        'name' : sc_name.strip(),
                        'campus' : buyer_data.get('school_college_campus', '').strip(),
                        'city' : unlisted_city,
                        'state' : unlisted_state
                    }

                    profile_needs_save = True

            if profile_needs_save:
                student_profile.save()
                
            created_registrations = []

            for i, attendee in enumerate(attendees_data):
                is_buyer = (i == 0)

                reg_email = user.email if is_buyer else attendee.get('email', user.email)
                reg_first_name = user.first_name if is_buyer else attendee.get('first_name', 'Guest')
                reg_last_name = user.last_name if is_buyer else attendee.get('last_name', '')

                school_college_name_str = None

                sc_id = attendee.get('school_college_id')

                if sc_id:
                    try:
                        sc = SchoolCollege.objects.get(id = sc_id)
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
                    school_college_name_str = f"{sc.name} - {sc.campus} ({sc.city})" if sc.campus else f"{sc.name} ({sc.city})"

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

        if locked_event.is_paid_event:

            return {
                'requires_payment' : True,
                'razorpay_order_id' : razorpay_order['id'],
                'amount' : total_amount_rupees
            }
        
        for reg in created_registrations:
            send_ticket_email.delay(str(reg.id))

        return {
            'requires_payment' : False,
            'tickets_created' : len(created_registrations)
        }
