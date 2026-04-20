# host_service.py


from django.contrib.auth import get_user_model
from django.db import transaction

from api.models import HostProfile


User = get_user_model()


class HostService:

    @staticmethod
    @transaction.atomic
    def add_team_member(owner, club_id, target_email):
        try:
            host_profile = HostProfile.objects.get(id = club_id, owner = owner)
        except HostProfile.DoesNotExist:

            raise ValueError("Host profile not found or you are not the owner.")
        
        try:
            target_user = User.objects.get(email__iexact = target_email.strip())
        except User.DoesNotExist:

            raise ValueError("Student not found. They must sign up for PLUG first.")
        
        if host_profile.users.filter(id = target_user.id).exists():

            return f"{target_user.first_name} is already on the team."
        
        host_profile.users.add(target_user)

        return f"Added {target_user.first_name} to the team."
    
    @staticmethod
    @transaction.atomic
    def remove_team_member(owner, club_id, target_email):
        try:
            host_profile = HostProfile.objects.get(id = club_id, owner = owner)
        except HostProfile.DoesNotExist:
            
            raise ValueError("Host profile not found or you are not the owner.")
        
        try:
            target_user = User.objects.get(email__iexact = target_email.strip())
        except User.DoesNotExist:

            raise ValueError("User not found.")
        
        if target_user == host_profile.owner:
            
            raise ValueError("You cannot remove the founder/owner from the team.")
        
        if not host_profile.users.filter(id = target_user.id).exists():

            raise ValueError("User is not a part of this team.")
        
        host_profile.users.remove(target_user)

        return f"Removed {target_user.first_name} from the team."
