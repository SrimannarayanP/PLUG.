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
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import TokenRefreshView

from api.views import (
    CancelTicketView, CategoryListView, CreateEventView, CreateUserView, CustomTokenObtainPairView, EventDetailsView, EventListView, FeaturedEventListView,
    HostEventDetailView, HostEventListView, HostEventUpdateView, ProcessPaymentView, RegisteredEventsView, RegisterForEventView, RequestPasswordResetView,
    ResendTicketView, SchoolCollegeListView, SetNewPasswordView, UpcomingEventListView, UserProfileView, VerifyTicketView, VerifyEmailOTPView, ResendOTPView
)
from api.utils import delete_event_document


urlpatterns = [
    path('admin/', admin.site.urls),
    # --- Authentication & Onboarding ---
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name = 'login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name = 'refresh-token'),
    path('api/auth/signup/', CreateUserView.as_view(), name = 'signup'),
    # --- Password Management ---
    path('api/auth/password-set/', SetNewPasswordView.as_view(), name = 'password-set'),
    path('api/auth/password-reset/', RequestPasswordResetView.as_view(), name = 'password-reset'),
    # --- Email Verification ---
    path('api/auth/verify-otp/', VerifyEmailOTPView.as_view(), name = 'verify-otp'),
    path('api/auth/resend-otp/', ResendOTPView.as_view(), name = 'resend-otp'),
    # --- User Profile ---
    path('api/user/profile/', UserProfileView.as_view(), name = 'user-profile'),
    # --- Public Data ---
    path('api/data/categories/', CategoryListView.as_view(), name = 'category-list'),
    path('api/data/colleges/', SchoolCollegeListView.as_view(), name = 'school-college-list'),
    # --- Event Discovery (Public) ---
    path('api/events/', EventListView.as_view(), name = 'event-list'),
    path('api/events/upcoming/', UpcomingEventListView.as_view(), name = 'upcoming-events'),
    path('api/events/featured/', FeaturedEventListView.as_view(), name = 'featured-events'),
    path('api/events/<uuid:id>/', EventDetailsView.as_view(), name = 'event-detail'),
    # --- Student Actions ---
    path('api/events/register/', RegisterForEventView.as_view(), name = 'event-register'),
    path('api/events/my-tickets/', RegisteredEventsView.as_view(), name = 'my-tickets'),
    path('api/ticket/resend<uuid:ticket_id>', ResendTicketView.as_view(), name = 'resend-ticket'),
    path('api/ticket/cancel/<uuid:ticket_id>', CancelTicketView.as_view(), name = 'cancel-ticket'),
    # --- Host Dashboard ---
    path('api/host/events/', HostEventListView.as_view(), name = 'host-event-list'),    
    path('api/host/create-event/', CreateEventView.as_view(), name = 'create-event'),
    # --- Management Endpoints ---
    path('api/host/event/<uuid:event_id>/', HostEventDetailView.as_view(), name = 'host-event-detail'),
    path('api/host/edit/<uuid:pk>/', HostEventUpdateView.as_view(), name = 'host-event-edit'),
    path('api/host/process-payment/', ProcessPaymentView.as_view(), name = 'process-payment'),
    # --- Document Deletion ---
    path('api/host/document/<int:doc_id>/delete/', delete_event_document, name = 'delete-doc'),
    # --- Scanner App ---
    path('api/scanner/verify/', VerifyTicketView.as_view(), name = 'verify-ticket'),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
