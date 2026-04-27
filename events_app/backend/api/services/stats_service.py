# stats_service.py


from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate, TruncHour


class EventStatsService:

    @staticmethod
    def get_event_metrics(event):
        # Top-line aggregates (To be immediately displayed on the dashboard)
        aggregates = event.registrations.filter(is_cancelled = False).aggregate(
            total_sold = Count('id'), total_revenue = Sum('amount_paid'), checked_in_count = Count('id', filter = Q(is_checked_in = True))
        )
        
        total_sold = aggregates['total_sold'] or 0

        total_clicks = event.outbound_clicks.count()
        conversion_rate = round(((total_sold / total_clicks) * 100), 2) if total_clicks > 0 else 0

        aggregates['total_clicks'] = total_clicks
        aggregates['conversion_rate'] = conversion_rate

        # Sales over time
        sales_velocity = event.registrations.filter(is_cancelled = False).annotate(date = TruncDate('created_at')).values('date').annotate(tickets = Count('id')).order_by('date')
        
        # Door traffic: Check-ins over time. We can use this to identify peak entry times and optimize staffing/logistics.
        door_traffic = event.registrations.filter(is_checked_in = True, checked_in_at__isnull = False).annotate(hour = TruncHour('checked_in_at')).values('hour').annotate(count = Count('id')).order_by('hour')

        # Demographics
        # F() expressions traverse relationships without pulling full objs.
        demographics = event.registrations.filter(
            is_cancelled = False, student__school_college__isnull = False
        ).values(college_name = F('student__school_college__name')).annotate(count = Count('id')).order_by('-count')[:5]

        # Payment friction: Query all registrations (including cancelled) to expose abandoned/failed checkouts.
        payment_funnel = event.registrations.values('payment_status').annotate(count = Count('id')).order_by('-count')

        return {
            'overview' : aggregates,
            'velocity' : list(sales_velocity),
            'door_traffic' : list(door_traffic),
            'demographics' : list(demographics),
            'payment_funnel' : list(payment_funnel)
        }
