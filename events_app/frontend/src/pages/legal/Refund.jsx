// Refund.jsx


import LegalLayout from './LegalLayout'


export default function Refund() {

    return (

        <LegalLayout title = "Refund & Cancellation Policy">
            <p>Last Updated: April 7, 2026</p>

            <h3>1. Event Cancellations</h3>
            <p>If an event organiser completely cancels an event prior to the start date, PLUG. will automatically initiate a full refund to all registered Attendees.</p>
            <p>
                Refunds are processed automatically to the original payment method & typically takes <strong>5-7 business days</strong> to reflect in your bank account,
                depending on your bank's processing times. PLUG. is not responsible for any delays caused by financial institutions.
            </p>

            <h3>2. Attendee Cancellations & Final Sales</h3>
            <p>Because PLUG. acts strictly as an intermediary, <strong>all ticket sales are final.</strong></p>
            <p>
                We do not issue refunds for schedule conflicts, illness, removal from the venue by security or dissatisfaction with the event. Individual ticket
                cancellations & refund requests are entirely at the discretion of the specific event organiser. PLUG. cannot force an organiser to issue a refund for an
                active event.
            </p>
            
            <h3>3. Postponements</h3>
            <p>
                If an event is postponed, your ticket will remain valid for the rescheduled date. If you cannot attend the new date, refund eligibility will be
                determined by the event organiser.
            </p>

            <h3>4. Processing Errors</h3>
            <p>
                If money was deducted from your account but a ticket was not generated (due to a network drop or payment gateway error), the transaction will automatically
                be revoked. The funds will either be credited to our system to generate your ticket or auto-refunded by the bank within 5-7 business days.
            </p>
        </LegalLayout>

    )

}
