# permissions.py


from rest_framework import permissions


class IsHostUser(permissions.BasePermission):
    """Allows access to users who manage at least 1 host profile."""

    message = "Your host profile is pending admin verification."
    
    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            
            return False

        return request.user.host_profiles.filter(is_verified = True).exists()


class IsEventOwner(permissions.BasePermission):
    """Allows only the managers of the host entity to edit the event."""

    def has_object_permission(self, request, obj):
        if request.method in permissions.SAFE_METHODS:

            return True

        return obj.host.users.filter(id = request.user.id).exists()


class IsEmailVerified(permissions.BasePermission):
    """Allows access only to users whose email is verified."""

    message = "You must verify your email address to perform this action."
    
    def has_permission(self, request, view):
        # Ensure the user is logged in.
        if not request.user or not request.user.is_authenticated:
            
            return False
        
        # Check the actual field.
        return request.user.is_email_verified
