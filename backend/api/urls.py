from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'locations', views.LocationViewSet, basename='location')
router.register(r'vehicle-types', views.VehicleTypeViewSet, basename='vehicletype')
router.register(r'vehicles', views.VehicleViewSet, basename='vehicle')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'maintenance-types', views.MaintenanceTypeViewSet, basename='maintenancetype')
router.register(r'maintenance-logs', views.MaintenanceLogViewSet, basename='maintenancelog')
router.register(r'routes', views.RouteViewSet, basename='route') # Add Route endpoint
router.register(r'user-profiles', views.UserProfileViewSet, basename='userprofile') # Example

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # Specific function-based views first
    path('routes/plan/', views.plan_routes_view, name='plan-routes'),
    path('locations/import/', views.import_locations_csv, name='import-locations-csv'),
    path('routes/<int:pk>/update_status/', views.update_route_status_view, name='update-route-status'),
    # Then include the router URLs
    path('', include(router.urls)),
]