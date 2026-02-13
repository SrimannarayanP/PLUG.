# permissions.py


from rest_framework import permissions


class IsHostUser(permissions.BasePermission):
    """Allows access to users who have an organisation profile."""

    def has_permission(self, request, view):

        return bool(request.user and request.user.is_authenticated and hasattr(request.user, 'organisation_profile'))


class IsEventOwner(permissions.BasePermission):
    """Allows only the owners of the event to edit it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:

            return True

        return obj.organisation == request.user.organisation_profile


class IsEmailVerified(permissions.BasePermission):
    """Allows access only to users whose email is verified."""

    message = "You must verify your email address to perform this action."
    
    def has_permission(self, request, view):
        # Ensure the user is logged in.
        if not request.user or not request.user.is_authenticated:
            
            return False
        
        # Check the actual field.
        return request.user.is_email_verified
