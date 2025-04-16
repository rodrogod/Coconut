from django.contrib import admin
from .models import (
    UserProfile, Location, VehicleType, Vehicle, Task, Route, RouteStop,
    MaintenanceType, MaintenanceLog
)

# Register your models here.

# Simple registrations (can be customized later)
admin.site.register(UserProfile)
admin.site.register(Location)
admin.site.register(VehicleType)
admin.site.register(Vehicle)
admin.site.register(Task)
admin.site.register(Route)
admin.site.register(RouteStop)
admin.site.register(MaintenanceType)
admin.site.register(MaintenanceLog)

# Example of customizing admin display (optional)
# class VehicleAdmin(admin.ModelAdmin):
#     list_display = ('license_plate', 'type', 'make', 'model', 'is_available')
#     list_filter = ('type', 'is_available')
#     search_fields = ('license_plate', 'make', 'model', 'vin')
#
# admin.site.register(Vehicle, VehicleAdmin)
