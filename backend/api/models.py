from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.utils import timezone # Import timezone

# Create your models here.

class UserProfile(models.Model):
    """
    Extends the default Django User model to add application-specific roles.
    """
    class Role(models.TextChoices):
        PLANNER = 'PLANNER', _('Planner')
        MANAGER = 'MANAGER', _('Logistics Manager')
        FLEET_ADMIN = 'FLEET_ADMIN', _('Fleet Administrator')
        ADMIN = 'ADMIN', _('System Administrator')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PLANNER,
    )

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class Location(models.Model):
    """
    Represents a physical location (Depot, Customer, Supplier).
    """
    class LocationType(models.TextChoices):
        CEDIS = 'CEDIS', _('Distribution Center (CEDIS)')
        SUCURSAL = 'SUCURSAL', _('Branch/Customer')
        PROVEEDOR = 'PROVEEDOR', _('Supplier')

    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.SUCURSAL,
    )
    # Assuming operating hours are relevant for all types for simplicity
    opening_time = models.TimeField(blank=True, null=True, help_text="Start of operating/delivery window")
    closing_time = models.TimeField(blank=True, null=True, help_text="End of operating/delivery window")
    average_service_time_mins = models.PositiveIntegerField(default=0, help_text="Average time spent at location in minutes")

    def __str__(self):
        return f"{self.get_type_display()}: {self.name}"

class VehicleType(models.Model):
    """
    Defines categories of vehicles based on capacity.
    """
    name = models.CharField(max_length=100, unique=True)
    max_weight_kg = models.FloatField(help_text="Maximum weight capacity in kilograms")
    max_volume_m3 = models.FloatField(help_text="Maximum volume capacity in cubic meters")

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    """
    Represents an individual vehicle in the fleet.
    """
    type = models.ForeignKey(VehicleType, on_delete=models.PROTECT, related_name='vehicles')
    license_plate = models.CharField(max_length=20, unique=True)
    make = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    vin = models.CharField(max_length=17, unique=True, blank=True, null=True, help_text="Vehicle Identification Number")
    current_odometer_km = models.FloatField(default=0)
    insurance_expiry = models.DateField(blank=True, null=True)
    is_available = models.BooleanField(default=True, help_text="Is the vehicle available for routing?")

    def __str__(self):
        return f"{self.license_plate} ({self.type.name})"

class Task(models.Model):
    """
    Represents a delivery or pickup task.
    """
    class TaskType(models.TextChoices):
        DELIVERY = 'DELIVERY', _('Delivery')
        PICKUP = 'PICKUP', _('Pickup')
        # Consider adding MIXED if a single task involves both at one location?
        # For now, assume separate tasks for pickup and delivery even if at same location.

    class TaskStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        ASSIGNED = 'ASSIGNED', _('Assigned to Route')
        COMPLETED = 'COMPLETED', _('Completed')
        # Add CANCELLED? FAILED?

    description = models.CharField(max_length=255, blank=True, help_text="Optional description of the task/items")
    # For simple P&D, origin is pickup, destination is delivery.
    # For delivery-only from depot, origin might be null or the depot.
    # For pickup-only to depot, destination might be null or the depot.
    # Let's require both for now, assuming tasks are point-to-point movements.
    origin = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='tasks_originating',
        help_text="Location where items are picked up"
    )
    destination = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='tasks_destined',
        help_text="Location where items are delivered"
    )
    weight_kg = models.FloatField(default=0, help_text="Weight of the items in kilograms")
    volume_m3 = models.FloatField(default=0, help_text="Volume of the items in cubic meters")
    type = models.CharField(
        max_length=10,
        choices=TaskType.choices,
        # Default depends on use case, maybe PENDING makes more sense?
        # Let's assume DELIVERY is common.
        default=TaskType.DELIVERY,
    )
    status = models.CharField(
        max_length=10,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
    )
    # Required date/time window for the *destination*
    required_date = models.DateField(help_text="Date the task needs to be completed by")
    window_start = models.TimeField(blank=True, null=True, help_text="Earliest time for service at destination")
    window_end = models.TimeField(blank=True, null=True, help_text="Latest time for service at destination")
    # Link to the route it's assigned to (set when planned)
    route = models.ForeignKey('Route', on_delete=models.SET_NULL, blank=True, null=True, related_name='tasks')

    def __str__(self):
        return f"Task {self.id}: {self.type} from {self.origin.name} to {self.destination.name} ({self.status})"

class Route(models.Model):
    """
    Represents a planned route for a single vehicle on a specific date.
    """
    class RouteStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Assignment') # Planned but not yet confirmed/sent
        ASSIGNED = 'ASSIGNED', _('Assigned to Vehicle/Driver')
        IN_TRANSIT = 'IN_TRANSIT', _('In Transit')
        COMPLETED = 'COMPLETED', _('Completed')
        DELAYED = 'DELAYED', _('Delayed') # Could be set based on ETA vs current time
        CANCELLED = 'CANCELLED', _('Cancelled')

    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='routes')
    # driver = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_routes', limit_choices_to={'profile__role__in': ['DRIVER', 'PLANNER']}) # Add Driver role later if needed
    planned_date = models.DateField(db_index=True)
    # Timestamps can be null until the route actually starts/ends
    start_time = models.DateTimeField(blank=True, null=True)
    estimated_end_time = models.DateTimeField(blank=True, null=True) # Calculated by solver
    actual_end_time = models.DateTimeField(blank=True, null=True) # Set when completed
    # Calculated values from solver/Maps API
    total_distance_km = models.FloatField(blank=True, null=True)
    total_duration_mins = models.PositiveIntegerField(blank=True, null=True, help_text="Estimated travel + service time")
    status = models.CharField(
        max_length=10,
        choices=RouteStatus.choices,
        default=RouteStatus.PENDING,
        db_index=True
    )
    created_at = models.DateTimeField(default=timezone.now) # Use default instead of auto_now_add
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Route {self.id} ({self.planned_date}) - Vehicle {self.vehicle.license_plate} ({self.status})"

    class Meta:
        ordering = ['planned_date', 'id']


class RouteStop(models.Model):
    """
    Represents a single stop within a planned route.
    """
    class StopType(models.TextChoices):
        START_DEPOT = 'START_DEPOT', _('Start Depot')
        PICKUP = 'PICKUP', _('Pickup')
        DELIVERY = 'DELIVERY', _('Delivery')
        END_DEPOT = 'END_DEPOT', _('End Depot')
        # BREAK = 'BREAK', _('Driver Break') # Add later if needed

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name='route_stops')
    # A stop might fulfill multiple tasks (e.g., pickup A, deliver B at same location)
    # tasks = models.ManyToManyField(Task, related_name='route_stops', blank=True) # Use M2M if needed
    # For simplicity now, assume one primary task per stop (or link stop to task in Task model)
    # Let's keep the ForeignKey in Task model pointing here for now.

    sequence_order = models.PositiveIntegerField(help_text="Order of the stop in the route sequence (0 for depot)")
    stop_type = models.CharField(max_length=15, choices=StopType.choices, default=StopType.DELIVERY)

    # Estimated times calculated by the solver
    estimated_arrival_time = models.DateTimeField(blank=True, null=True)
    estimated_departure_time = models.DateTimeField(blank=True, null=True) # Arrival + Service Time

    # Actual times recorded during execution (optional)
    actual_arrival_time = models.DateTimeField(blank=True, null=True)
    actual_departure_time = models.DateTimeField(blank=True, null=True)

    # Load changes at this stop (can be calculated from associated tasks)
    load_weight_change_kg = models.FloatField(default=0, help_text="Positive for pickup, negative for delivery")
    load_volume_change_m3 = models.FloatField(default=0, help_text="Positive for pickup, negative for delivery")

    # Cumulative load *after* this stop (calculated during planning/saving)
    cumulative_weight_kg = models.FloatField(blank=True, null=True)
    cumulative_volume_m3 = models.FloatField(blank=True, null=True)

    distance_from_previous_km = models.FloatField(blank=True, null=True)
    duration_from_previous_mins = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self):
        return f"Route {self.route.id} Stop {self.sequence_order}: {self.location.name} ({self.stop_type})"

    class Meta:
        ordering = ['route', 'sequence_order']
        unique_together = ('route', 'sequence_order') # Ensure sequence is unique per route


# --- Fleet Management Models (Phase 4) ---

class MaintenanceType(models.Model):
    """
    Defines types of maintenance tasks (e.g., Oil Change, Tire Rotation).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    # Recommended interval (either distance or time, or both)
    interval_km = models.PositiveIntegerField(blank=True, null=True, help_text="Recommended interval in kilometers")
    interval_days = models.PositiveIntegerField(blank=True, null=True, help_text="Recommended interval in days")

    def __str__(self):
        return self.name

class MaintenanceLog(models.Model):
    """
    Logs completed or scheduled maintenance for a vehicle.
    """
    class MaintenanceStatus(models.TextChoices):
        SCHEDULED = 'SCHEDULED', _('Scheduled')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_logs')
    maintenance_type = models.ForeignKey(MaintenanceType, on_delete=models.PROTECT)
    scheduled_date = models.DateField(blank=True, null=True, db_index=True)
    completion_date = models.DateField(blank=True, null=True)
    odometer_at_maintenance = models.FloatField(blank=True, null=True, help_text="Odometer reading when maintenance was done/scheduled")
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=15,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.SCHEDULED,
        db_index=True
    )
    # Track when the vehicle should be unavailable
    unavailable_start_date = models.DateField(blank=True, null=True)
    unavailable_end_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True) # Use auto_now_add here, default handled by Django
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.maintenance_type.name} ({self.status} on {self.scheduled_date or self.completion_date or 'N/A'})"

    class Meta:
        ordering = ['-scheduled_date', '-completion_date']
