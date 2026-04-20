# payment_service.py


from django.conf import settings
from django.db import IntegrityError, transaction

from api.models import ProcessedWebhook, Registration
from api.tasks import process_transaction_refund, send_ticket_email

import logging, razorpay


logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class PaymentService:

    @staticmethod
    def verify_payment(razorpay_payment_id, razorpay_order_id, razorpay_signature):
        params_dict = {
            'razorpay_order_id' : razorpay_order_id,
            'razorpay_payment_id' : razorpay_payment_id,
            'razorpay_signature' : razorpay_signature
        }

        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            logger.critical(f"Forge attempt detected for order {razorpay_order_id}")

            raise ValueError("Payment verification failed. Invalid signature")
        
        with transaction.atomic():
            registrations = Registration.objects.select_for_update().filter(razorpay_order_id = razorpay_order_id, is_cancelled = False)

            if not registrations.exists():

                raise ValueError("Order not found.")
            
            pending_registrations = registrations.filter(payment_status = Registration.PaymentStatus.PENDING)

            if not pending_registrations.exists():
                verified_regs = registrations.filter(payment_status = Registration.PaymentStatus.VERIFIED)
                
                if verified_regs.exists():

                    return {'status' : 'already_processed', 'tickets_processed' : verified_regs.count()}
                
                raise ValueError("Order already processed or in an invalid state.")
            
            processed_count = 0

            for reg in pending_registrations:
                reg.payment_status = Registration.PaymentStatus.VERIFIED
                reg.razorpay_payment_id = razorpay_payment_id
                reg.razorpay_signature = razorpay_signature
                reg.save()

                transaction.on_commit(lambda r = reg: send_ticket_email.delay(str(r.id)))

                processed_count += 1

        return {'status' : 'success', 'tickets_processed' : processed_count}
    
    @staticmethod
    def process_webhook(razorpay_event_id, payload_dict):
        if razorpay_event_id:
            try:
                ProcessedWebhook.objects.create(razorpay_event_id = razorpay_event_id)
            except IntegrityError:
                logger.info(f"Duplicate webhook {razorpay_event_id} ignored.")

                return 'ignored'
            
        event_name = payload_dict.get('event')

        if event_name == 'payment.captured':
            payment_entity = payload_dict['payload']['payment']['entity']
            razorpay_payment_id = payment_entity['id']
            razorpay_order_id = payment_entity['order_id']

            with transaction.atomic():
                registrations = Registration.objects.select_for_update().filter(razorpay_order_id = razorpay_order_id)

                if not registrations.exists():
                    logger.error(f"Webhook received for unknown order: {razorpay_order_id}")

                    return 'ignored'
                
                cancelled_registrations = registrations.filter(
                    is_cancelled = True, payment_status__in = [Registration.PaymentStatus.PENDING, Registration.PaymentStatus.REJECTED]
                )

                pending_valid_registrations = registrations.filter(is_cancelled = False, payment_status = Registration.PaymentStatus.PENDING)

                if cancelled_registrations.exists():
                    refund_amount_rupees = sum([reg.event.ticket_price for reg in cancelled_registrations])
                    refund_amount_paise = int(refund_amount_rupees * 100)

                    logger.info(f"Late payment detected for cancelled order {razorpay_order_id}. Initiating auto-refund.")

                    try:
                        razorpay_client.payment.refund(razorpay_payment_id, {'amount' : refund_amount_paise})
                        cancelled_registrations.update(
                            payment_status = Registration.PaymentStatus.REFUND_PROCESSED, razorpay_payment_id = razorpay_payment_id
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
                pending_refunds = Registration.objects.select_for_update().filter(
                    razorpay_payment_id = razorpay_payment_id, payment_status = Registration.PaymentStatus.REFUND_PENDING
                )

                if pending_refunds.exists():
                    updated_count = pending_refunds.update(payment_status = Registration.PaymentStatus.REFUND_PROCESSED)

                    logger.info(f"Successfully marked {updated_count} tickets as REFUND_PROCESSED for payment {razorpay_payment_id}.")
                else:
                    logger.warning(f"Received refund.processed for {razorpay_payment_id} but no pending tickets found.")

        return 'processed'
    
    @staticmethod
    def initiate_manual_refund(user, registration_id):
        with transaction.atomic():
            try:
                registration = Registration.objects.select_for_update().get(id = registration_id, event__host__in = user.host_profiles.all())
            except Registration.DoesNotExist:

                raise ValueError("Registration not found or authorized.")
            
            if registration.payment_status != Registration.PaymentStatus.REFUND_PENDING:

                raise ValueError("Ticket is not pending a refund.")
            
            transaction.on_commit(lambda pid = registration.razorpay_payment_id: process_transaction_refund.delay(pid))

            return True
        
    @staticmethod
    def cancel_pending_order(user, razorpay_order_id):
        released_count = Registration.objects.filter(
            student__user = user, razorpay_order_id = razorpay_order_id, payment_status = Registration.PaymentStatus.PENDING, is_cancelled = False
        ).update(is_cancelled = True, payment_status = Registration.PaymentStatus.REJECTED)

        return released_count
