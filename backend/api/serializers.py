from rest_framework import serializers
# Removed redundant import
from django.contrib.auth.models import User
from .models import ( # Import all models needed
    Location, VehicleType, Vehicle, UserProfile, Task, Route, RouteStop,
    MaintenanceType, MaintenanceLog
)

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__' # Include all fields for now

class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    # Optionally display the type name instead of just the ID
    type_name = serializers.CharField(source='type.name', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'type', 'type_name', 'license_plate', 'make', 'model',
            'vin', 'current_odometer_km', 'insurance_expiry', 'is_available'
        ]
        # Make 'type' writeable by ID, but show 'type_name' when reading
        read_only_fields = ['type_name']

# Example UserProfile Serializer (can be expanded later)
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'role']
        read_only_fields = ['user', 'username', 'email'] # User details are read-only here

class TaskSerializer(serializers.ModelSerializer):
    # Optionally display related object names instead of just IDs
    origin_name = serializers.CharField(source='origin.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    # Display status and type labels
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'description', 'origin', 'origin_name', 'destination',
            'destination_name', 'weight_kg', 'volume_m3', 'type', 'type_display',
            'status', 'status_display', 'required_date', 'window_start',
            'window_end', 'route' # route is nullable/blank initially
        ]
        read_only_fields = [
            'origin_name', 'destination_name', 'status_display', 'type_display',
            'route' # Route assignment happens via planning, not direct Task edit
        ]

class TaskBasicSerializer(serializers.ModelSerializer):
    """Simplified Task serializer for nesting."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'description', 'status', 'status_display'] # Include status and its display name

# --- Fleet Management Serializers (Phase 4) ---

class MaintenanceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceType
        fields = '__all__'

class MaintenanceLogSerializer(serializers.ModelSerializer):
    # Optionally display related names
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    maintenance_type_name = serializers.CharField(source='maintenance_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MaintenanceLog
        fields = [
            'id', 'vehicle', 'vehicle_plate', 'maintenance_type', 'maintenance_type_name',
            'scheduled_date', 'completion_date', 'odometer_at_maintenance', 'cost',
            'notes', 'status', 'status_display', 'unavailable_start_date', 'unavailable_end_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'vehicle_plate', 'maintenance_type_name', 'status_display',
            'created_at', 'updated_at'
        ]

# --- Route & Stop Serializers ---

class RouteStopSerializer(serializers.ModelSerializer):
    """Serializer for individual stops within a route."""
    location_name = serializers.CharField(source='location.name', read_only=True)
    # Add other fields needed for display (e.g., task info if linked differently)
    class Meta:
        model = RouteStop
        fields = [
            'id', 'sequence_order', 'location', 'location_name', 'stop_type',
            'estimated_arrival_time', 'estimated_departure_time',
            'actual_arrival_time', 'actual_departure_time',
            'load_weight_change_kg', 'load_volume_change_m3',
            'cumulative_weight_kg', 'cumulative_volume_m3',
            'distance_from_previous_km', 'duration_from_previous_mins'
        ]
        read_only_fields = ['location_name'] # Most fields are read-only as they are set by planning/execution

class RouteSerializer(serializers.ModelSerializer):
    """Serializer for Routes, including nested stops."""
    # Nest stops for detailed view
    stops = RouteStopSerializer(many=True, read_only=True)
    # Include related vehicle info
    vehicle = VehicleSerializer(read_only=True) # Use existing VehicleSerializer
    # Display status label
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Include assigned tasks (just IDs for now, could expand later)
    tasks = TaskBasicSerializer(many=True, read_only=True) # Use the simplified serializer

    class Meta:
        model = Route
        fields = [
            'id', 'vehicle', 'planned_date', 'start_time', 'estimated_end_time',
            'actual_end_time', 'total_distance_km', 'total_duration_mins',
            'status', 'status_display', 'created_at', 'updated_at',
            'stops', # Include nested stops
            'tasks' # Include assigned tasks
        ]
        read_only_fields = [
             'status_display', 'created_at', 'updated_at', 'stops', 'tasks', 'vehicle'
             # Most fields are read-only as they are set by planning
        ]