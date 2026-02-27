# admin.py


from django.contrib import admin
from django.db.models import JSONField
from django.contrib import messages

from .models import Event, OrganisationProfile, Category, CustomUser, SchoolCollege, UnlistedSchoolCollege, StudentProfile

# Register your models here.
admin.site.register(Event)
admin.site.register(OrganisationProfile)
admin.site.register(Category)
admin.site.register(CustomUser)


@admin.register(UnlistedSchoolCollege)
class UnlistedSchoolCollegeAdmin(admin.ModelAdmin):

    list_display = ('name', 'campus', 'city', 'state', 'request_count')
    search_fields = ('name', 'city', 'state')
    list_filter = ('state',)
    ordering = ('-request_count',)

    actions = ['approve_and_convert']

    @admin.action(description = "Approve & convert to official School/College")
    def approve_and_convert(self, request, queryset):
        success_count = 0
        student_update_count = 0

        for school_college_request in queryset:
            official_school_college, created = SchoolCollege.objects.get_or_create(
                name = school_college_request.name,
                campus = school_college_request.campus,
                city = school_college_request.city,
                state = school_college_request.state
            )

            students_to_update = StudentProfile.objects.filter(
                unlisted_school_college_data__name = school_college_request.name,
                unlisted_school_college_data__campus = school_college_request.campus if school_college_request.campus else '',
                unlisted_school_college_data__city = school_college_request.city,
                unlisted_SchoolCollege_data__state = school_college_request.state
            )

            for student in students_to_update:
                student.school_college = official_school_college
                student.unlisted_school_college_data = {}
                student.save()

                student_update_count += 1

            school_college_request.delete()
            success_count += 1
        
        self.message_user(
            request,
            f"Successfully approved {success_count} colleges. Upgraded {student_update_count} student profiles.",
            messages.SUCCESS
        )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):

    list_display = ('user_email', 'get_official_school_college', 'get_quarantine_data', 'phone_number')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    list_filter = ('school_college',)

    autocomplete_fields = ['school_college']

    def user_email(self, obj):
        if obj.user.email:

            return obj.user.email
        
    user_email.short_description = 'Email'
        
    def get_official_school_college(self, obj):
        if obj.school_college:
            
            return f"{obj.school_college.name} ({obj.school_college.city})"
        
        return '-'
    
    get_official_school_college.short_description = "Official School/College"

    def get_quarantine_data(self, obj):
        data = obj.unlisted_school_college_data

        if data and isinstance(data, dict) and data.get('name'):
            name = data.get('name')
            campus = data.get('campus')
            city = data.get('city')

            if campus:
                
                return f"⚠️ {name} - {campus} ({city})"
            
            return f"⚠️ {name} ({city})"
        
        return 'Clean'
    
    get_quarantine_data.short_description = "Quarantine Status"

    def save_model(self, request, obj, form, change):
        if obj.school_college is not None:
            obj.unlisted_school_college_data = {}

        super().save_model(request, obj, form, change)


@admin.register(SchoolCollege)
class SchoolCollegeAdmin(admin.ModelAdmin):

    list_display = ('name', 'campus', 'city', 'state')
    search_fields = ('name', 'campus', 'city')
    list_filter = ('state',)
