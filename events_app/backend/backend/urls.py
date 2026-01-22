# urls.py


"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from api.views import (
    CreateUserView, CustomTokenObtainPairView, EventListView, RegisterForEventView, UpcomingEventListView, UserProfileView, FeaturedEventListView, VerifyTicketView, 
    CreateEventView, HostEventListView, RegisteredEventsView, HostEventDetailView, ProcessPaymentView, SetNewPasswordView, RequestPasswordResetView, EventDetailsView, 
    CategoryListView, SchoolCollegeListView
)

from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name = 'get-token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name = 'refresh-token'),
    path('api/user/register/', CreateUserView.as_view(), name = 'register-user'),
    path('api/user/profile/', UserProfileView.as_view(), name = 'user-profile'),
    path('api/events/', EventListView.as_view(), name = 'event-list'),
    path('api/events/register/', RegisterForEventView.as_view(), name = 'register-for-event'),
    path('api/events/registered/', RegisteredEventsView.as_view(), name = 'registered-events'),
    path('api/events/upcoming/', UpcomingEventListView.as_view(), name = 'upcoming-events'),
    path('api/events/featured/', FeaturedEventListView.as_view(), name = 'featured-events'),
    path('api/ticket/verify-ticket/', VerifyTicketView.as_view(), name = 'verify-ticket'),
    path('api/events/create-event/', CreateEventView.as_view(), name = 'create-event'),
    path('api/host/events/', HostEventListView.as_view(), name = 'host-event-list'),
    path('api/host/event/<int:event_id>/', HostEventDetailView.as_view(), name = 'host-event-detail'),
    path('api/host/process-payment/', ProcessPaymentView.as_view(), name = 'process-payment'),
    path('api/auth/set-new-password/', SetNewPasswordView.as_view(), name = 'set-password'),
    path('api/auth/request-password-reset/', RequestPasswordResetView.as_view(), name = 'request_password_reset'),
    path('api/events/<int:id>/', EventDetailsView.as_view(), name = 'event-detail'),
    path('api/categories/', CategoryListView.as_view(), name = 'category-list'),
    path('api/colleges/', SchoolCollegeListView.as_view(), name = 'school-college-list'),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
