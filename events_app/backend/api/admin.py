# admin.py


from django.contrib import admin

from .models import Event, OrganisationProfile, Category, CustomUser

# Register your models here.
admin.site.register(Event)
admin.site.register(OrganisationProfile)
admin.site.register(Category)
admin.site.register(CustomUser)
