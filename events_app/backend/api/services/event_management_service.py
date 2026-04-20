# event_management_service.py


from django.db import transaction
from django.utils import timezone

from api.models import Event, EventDocument, Registration, SchoolCollege
from api.tasks import initiate_mass_refunds

import logging


logger = logging.getLogger(__name__)


class EventManagementService:

    @staticmethod
    @transaction.atomic
    def create_event(user, validated_data, is_internal_event, requested_school_college_ids):
        host_profile = user.host_profiles.first()

        if not host_profile:

            raise ValueError("You do not manage any host profiles.")
        
        documents_data = validated_data.pop('uploaded_documents', [])
        categories = validated_data.pop('categories', [])

        validated_data['host'] = host_profile

        event = Event.objects.create(**validated_data)
        event.categories.set(categories)

        if is_internal_event:
            if requested_school_college_ids:
                colleges = SchoolCollege.objects.filter(id__in = requested_school_college_ids)

                if host_profile.school_college and host_profile.school_college not in colleges:
                    colleges = list(colleges)
                    colleges.append(host_profile.school_college)

                event.restricted_to_schools_colleges.set(colleges)
            elif host_profile.school_college:
                event.restricted_to_schools_colleges.set([host_profile.school_college])
            else:

                raise ValueError("External promoters must select a target college for internal events.")
            
        for file in documents_data[:5]:
            EventDocument.objects.create(event = event, file = file, name = file.name)

        return event
    
    @staticmethod
    @transaction.atomic
    def update_event(event, validated_data, is_internal_event, requested_school_college_ids):
        was_cancelled = event.is_cancelled
        becoming_cancelled = validated_data.get('is_cancelled', was_cancelled)

        if was_cancelled and not becoming_cancelled:

            raise ValueError("You cannot un-cancel an event once it has been cancelled & refunds are initiated.")
        
        if not was_cancelled and becoming_cancelled and event.start_date <= timezone.now():

            raise ValueError("Cannot cancel an event that has already started or passed.")
        
        documents_data = validated_data.pop('uploaded_documents', [])
        categories = validated_data.pop('categories', None)

        for attr, value in validated_data.items():
            setattr(event, attr, value)

        if categories is not None:
            event.categories.set(categories)

        if is_internal_event is True:
            if event.host.school_college:
                event.restricted_to_schools_colleges.set([event.host.school_college])
            elif requested_school_college_ids:
                colleges = SchoolCollege.objects.filter(id__in = requested_school_college_ids)

                event.restricted_to_schools_colleges.set(colleges)
            else:
                
                raise ValueError("External promoters must select a target school/college for internal events.")
        elif is_internal_event is False:
            event.restricted_to_schools_colleges.clear()

        current_count = event.documents.count()

        for file in documents_data:
            if current_count < 5:
                EventDocument.objects.create(event = event, file = file, name = file.name)

                current_count += 1

        event.save()

        if becoming_cancelled and not was_cancelled:
            Registration.objects.filter(
                event = event, is_cancelled = False, payment_status = Registration.PaymentStatus.VERIFIED
            ).update(is_cancelled = True, payment_status = Registration.PaymentStatus.REFUND_PENDING)
            
            Registration.objects.filter(
                event = event, is_cancelled = False, payment_status = Registration.PaymentStatus.PENDING
            ).update(is_cancelled = True, payment_status = Registration.PaymentStatus.REJECTED)

            transaction.on_commit(lambda e_id = str(event.id): initiate_mass_refunds.delay(e_id))

        return event
    
    @staticmethod
    def delete_document(user, doc_id):
        from django.shortcuts import get_object_or_404

        doc = get_object_or_404(EventDocument, id = doc_id)

        if not doc.event.host.users.filter(id = user.id).exists():

            raise ValueError("Permission denied. You do not manage this event.")
        
        doc.delete()
            
