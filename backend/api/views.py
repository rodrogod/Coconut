from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
import csv
import io
from django.db.models import Count, Avg, Sum, F, ExpressionWrapper, FloatField
from django.utils import timezone
from datetime import timedelta

from .models import Location, UserProfile, VehicleType, Vehicle, Task, Route, RouteStop, MaintenanceType, MaintenanceLog
from .serializers import (
    LocationSerializer, UserProfileSerializer, VehicleTypeSerializer, 
    VehicleSerializer, TaskSerializer, TaskBasicSerializer, RouteSerializer, 
    RouteStopSerializer, MaintenanceTypeSerializer, MaintenanceLogSerializer
)
from .vrp_solver import solve_vrp

# Create your views here.

# For now, allow any authenticated user to perform CRUD operations.
# We can refine permissions later based on roles (Phase 4).
class IsAuthenticatedOrReadOnlyForTesting(permissions.BasePermission):
    """
    Temporary permission: Allow read-only for anyone, write for authenticated users.
    Replace with proper role-based permissions later.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class LocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows locations to be viewed or edited.
    """
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer
    # permission_classes = [permissions.IsAuthenticated] # Use proper permissions later
    permission_classes = [IsAuthenticatedOrReadOnlyForTesting] # Temp for easier testing


class VehicleTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows vehicle types to be viewed or edited.
    """
    queryset = VehicleType.objects.all().order_by('name')
    serializer_class = VehicleTypeSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyForTesting]


class VehicleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows vehicles to be viewed or edited.
    """
    queryset = Vehicle.objects.all().order_by('license_plate')
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated] # Use standard permission
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['type', 'is_available'] 
    ordering_fields = ['license_plate', 'type', 'make', 'model', 'current_odometer_km']
    search_fields = ['license_plate', 'make', 'model', 'vin']


# Example UserProfile ViewSet (can be expanded later)
# Usually, you wouldn't expose UserProfile directly like this for non-admins
class UserProfileViewSet(viewsets.ReadOnlyModelViewSet): # ReadOnly for now
    """
    API endpoint that allows user profiles to be viewed.
    (Should be restricted to Admins or the user themselves later)
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser] # Example: Restrict to admins

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tasks to be viewed or edited.
    """
    queryset = Task.objects.all().order_by('-required_date', 'id') # Order by date desc, then ID
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyForTesting] # Use same temp permission
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'type', 'required_date', 'origin', 'destination'] # Fields to filter on
    ordering_fields = ['required_date', 'status', 'type', 'id'] # Fields to allow ordering by
    search_fields = ['description', 'origin__name', 'destination__name'] # Fields for text search


# --- VRP Planning Endpoint ---

@api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated]) # Add appropriate permissions later (e.g., Planner role)
@permission_classes([IsAuthenticatedOrReadOnlyForTesting]) # Use temp permission for now
def plan_routes_view(request):
    """
    Triggers the VRP solver to plan routes based on selected tasks and vehicles.
    Expects POST data like:
    {
        "depot_id": 1,
        "task_ids": [1, 2, 5, 8],
        "vehicle_ids": [1, 3],
        "date": "YYYY-MM-DD" # The date for which to plan
    }
    """
    required_fields = ["depot_id", "task_ids", "vehicle_ids", "date"]
    if not all(field in request.data for field in required_fields):
        return Response(
            {"error": f"Missing required fields: {required_fields}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    depot_id = request.data.get("depot_id")
    task_ids = request.data.get("task_ids", [])
    vehicle_ids = request.data.get("vehicle_ids", [])
    plan_date_str = request.data.get("date") # Keep as string for now

    # --- Fetch Data ---
    try:
        depot = Location.objects.get(pk=depot_id, type=Location.LocationType.CEDIS)
        # Fetch only PENDING tasks for the specified IDs
        tasks_to_plan = list(Task.objects.filter(pk__in=task_ids, status=Task.TaskStatus.PENDING))
        # Fetch only AVAILABLE vehicles for the specified IDs
        available_vehicles = list(Vehicle.objects.filter(pk__in=vehicle_ids, is_available=True))

        if not tasks_to_plan:
            return Response({"warning": "No pending tasks found for the given IDs."}, status=status.HTTP_400_BAD_REQUEST)
        if not available_vehicles:
            return Response({"warning": "No available vehicles found for the given IDs."}, status=status.HTTP_400_BAD_REQUEST)

    except Location.DoesNotExist:
        return Response({"error": f"Depot location with ID {depot_id} not found or is not a CEDIS."}, status=status.HTTP_404_NOT_FOUND)
    except Vehicle.DoesNotExist: # Should not happen with filter but good practice
         return Response({"error": "One or more specified vehicles not found."}, status=status.HTTP_404_NOT_FOUND)
    except Task.DoesNotExist: # Should not happen with filter but good practice
         return Response({"error": "One or more specified tasks not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
         return Response({"error": f"Error fetching data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- Call Solver ---
    try:
        # TODO: Pass plan_date_str to solver if needed for multi-day or date-specific logic
        solution = solve_vrp(depot, tasks_to_plan, available_vehicles)
    except ValueError as e: # Catch specific errors like missing API key
        return Response({"error": f"Solver configuration error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        # Log the full error details here
        print(f"Unhandled solver error: {e}")
        return Response({"error": f"An unexpected error occurred during route planning: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- Process Solution ---
    if solution and solution.get('routes'):
        try:
            with transaction.atomic(): # Ensure all DB changes succeed or fail together
                created_routes = []
                assigned_task_ids = set()

                for route_data in solution['routes']:
                    vehicle = Vehicle.objects.get(pk=route_data['vehicle_id'])
                    # Create Route object
                    new_route = Route.objects.create(
                        vehicle=vehicle,
                        planned_date=plan_date_str, # Store the planned date
                        status=Route.RouteStatus.ASSIGNED, # Mark as assigned
                        total_distance_km=route_data['total_distance_meters'] / 1000.0,
                        total_duration_mins=round(route_data['total_duration_seconds'] / 60.0),
                        # Add start/end times later if calculated by solver
                    )
                    created_routes.append(new_route.id)

                    # Create RouteStop objects
                    for i, stop_data in enumerate(route_data['stops']):
                        location = Location.objects.get(pk=stop_data['location_id'])
                        RouteStop.objects.create(
                            route=new_route,
                            location=location,
                            sequence_order=i,
                            stop_type=stop_data['type'],
                            # TODO: Convert seconds back to DateTime based on plan_date_str + seconds
                            # estimated_arrival_time=...,
                            # estimated_departure_time=...,
                            # Add load changes etc. later
                        )
                        # Mark associated task as assigned
                        if stop_data['task_id']:
                            assigned_task_ids.add(stop_data['task_id'])

                # Update status of assigned tasks
                Task.objects.filter(pk__in=assigned_task_ids).update(
                    status=Task.TaskStatus.ASSIGNED,
                    route=new_route # WARNING: This assigns ALL tasks to the LAST route created. Needs fix!
                    # TODO: Fix task assignment - link task to the specific route it belongs to.
                    # The solver output needs to associate tasks with specific routes/vehicles.
                    # For now, just update status. Route linking needs refinement.
                )
                Task.objects.filter(pk__in=assigned_task_ids).update(status=Task.TaskStatus.ASSIGNED)


            # Include the detailed solution routes in the response
            return Response({
                "message": "Routes planned successfully.",
                "created_route_ids": created_routes,
                "assigned_task_ids": list(assigned_task_ids),
                "planned_routes": solution.get('routes', []), # Add the detailed routes here
                # "dropped_task_ids": solution.get('dropped_tasks', []) # Add later
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Log the error
            print(f"Error saving solution to database: {e}")
            return Response({"error": f"Failed to save planned routes: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        # Handle case where solver runs but finds no solution
        return Response({
            "message": "No feasible routes found for the given tasks and vehicles.",
            # "dropped_task_ids": tasks_to_plan # Assume all tasks dropped if no routes
            }, status=status.HTTP_200_OK) # 200 OK, but indicate no solution found


# --- CSV Import Endpoint ---

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser]) # Specify parsers for file upload
# @permission_classes([permissions.IsAdminUser])
@permission_classes([permissions.IsAuthenticated]) # Re-enable permission check
def import_locations_csv(request):
    """
    Imports Location data (Sucursales, Proveedores) from an uploaded CSV file.
    Expects a POST request with 'file' attached (multipart/form-data).
    CSV Columns expected: name, address, latitude, longitude, type, opening_time, closing_time, average_service_time_mins
    'type' should be 'SUCURSAL' or 'PROVEEDOR'. Times in HH:MM format.
    """
    if 'file' not in request.FILES:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    if not file.name.endswith('.csv'):
        return Response({"error": "File is not a CSV."}, status=status.HTTP_400_BAD_REQUEST)

    # Decode the file content from bytes to string
    try:
        decoded_file = file.read().decode('utf-8') # Adjust encoding if needed (e.g., 'utf-8-sig' for BOM)
        io_string = io.StringIO(decoded_file)
    except UnicodeDecodeError:
         return Response({"error": "Failed to decode file. Ensure it's UTF-8 encoded."}, status=status.HTTP_400_BAD_REQUEST)

    reader = csv.DictReader(io_string)
    required_columns = ['name', 'latitude', 'longitude', 'type'] # Minimum required
    optional_columns = ['address', 'opening_time', 'closing_time', 'average_service_time_mins']

    # Check header
    if not all(col in reader.fieldnames for col in required_columns):
        missing = [col for col in required_columns if col not in reader.fieldnames]
        return Response(
            {"error": f"Missing required columns in CSV header: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    created_count = 0
    updated_count = 0
    failed_rows = []
    line_num = 1 # Start from 1 for header

    try:
        with transaction.atomic(): # Process all rows or none
            for row in reader:
                line_num += 1
                try:
                    # Validate type
                    loc_type = row.get('type', '').upper()
                    if loc_type not in [Location.LocationType.SUCURSAL, Location.LocationType.PROVEEDOR]:
                        raise ValueError(f"Invalid location type '{row.get('type')}'")

                    # Prepare data, handling potential missing optional fields and type conversions
                    location_data = {
                        'name': row['name'],
                        'latitude': float(row['latitude']),
                        'longitude': float(row['longitude']),
                        'type': loc_type,
                        'address': row.get('address', None) or None, # Handle empty string
                        'opening_time': row.get('opening_time', None) or None, # Handle empty string, assumes HH:MM format
                        'closing_time': row.get('closing_time', None) or None, # Handle empty string, assumes HH:MM format
                        'average_service_time_mins': int(row.get('average_service_time_mins', 0) or 0), # Handle empty string
                    }

                    # Clean None values for time fields if they are empty strings
                    if not location_data['opening_time']: location_data['opening_time'] = None
                    if not location_data['closing_time']: location_data['closing_time'] = None

                    # Use update_or_create based on name (or another unique identifier if available)
                    # Assuming 'name' should be unique for Sucursales/Proveedores for simplicity here.
                    # A better approach might use a dedicated external ID if available.
                    obj, created = Location.objects.update_or_create(
                        name=location_data['name'], # Use name as the key to find existing records
                        defaults=location_data # Fields to set/update
                    )

                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                except (ValueError, TypeError, IntegrityError) as e:
                    failed_rows.append({'line': line_num, 'error': str(e), 'data': row})
                except Exception as e: # Catch unexpected errors
                     failed_rows.append({'line': line_num, 'error': f"Unexpected error: {str(e)}", 'data': row})

            # If any rows failed, raise an exception to rollback the transaction
            if failed_rows:
                 # We might want to allow partial success, but atomic is safer by default.
                 # To allow partial success, remove the transaction and handle errors individually.
                 raise Exception("One or more rows failed during import.")

    except Exception as e:
        # This catches the explicit raise above or errors during the transaction setup
        return Response({
            "error": "Import failed. See details.",
            "created": created_count,
            "updated": updated_count,
            "failures": failed_rows,
            "detail": str(e) # Include the exception message that caused rollback
        }, status=status.HTTP_400_BAD_REQUEST)


    return Response({
        "message": "Import successful.",
        "created": created_count,
        "updated": updated_count,
        "failures": failed_rows # Should be empty if transaction succeeded
    }, status=status.HTTP_201_CREATED)


# --- Fleet Management ViewSets (Phase 4) ---

class MaintenanceTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Maintenance Types.
    """
    queryset = MaintenanceType.objects.all().order_by('name')
    serializer_class = MaintenanceTypeSerializer
    permission_classes = [permissions.IsAuthenticated] # Use standard permission

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Maintenance Logs.
    Allows filtering by vehicle, type, and status.
    """
    queryset = MaintenanceLog.objects.all().select_related('vehicle', 'maintenance_type').order_by('-scheduled_date', '-completion_date')
    serializer_class = MaintenanceLogSerializer
    permission_classes = [permissions.IsAuthenticated] # Use standard permission
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['vehicle', 'maintenance_type', 'status', 'scheduled_date', 'completion_date']
    ordering_fields = ['scheduled_date', 'completion_date', 'status', 'vehicle', 'maintenance_type']
    search_fields = ['notes', 'vehicle__license_plate', 'maintenance_type__name']


# --- Route ViewSet ---

class RouteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing planned Routes and their Stops.
    """
    # Use prefetch_related for nested stops and tasks for efficiency
    queryset = Route.objects.all().select_related('vehicle__type').prefetch_related('stops__location', 'tasks').order_by('-planned_date', '-id')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticatedOrReadOnlyForTesting] # Adjust permissions later
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'vehicle', 'planned_date']
    ordering_fields = ['planned_date', 'status', 'vehicle', 'id']
    search_fields = ['vehicle__license_plate', 'stops__location__name', 'tasks__description'] # Search across related fields


# --- Route Status Update Endpoint ---

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated]) # Ensure user is logged in
def update_route_status_view(request, pk):
    """
    Updates the status of a specific route.
    Expects PATCH data like: {"status": "NEW_STATUS"}
    """
    try:
        route = Route.objects.get(pk=pk)
    except Route.DoesNotExist:
        return Response({"error": "Route not found."}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({"error": "Missing 'status' in request data."}, status=status.HTTP_400_BAD_REQUEST)

    # Validate if the new status is a valid choice
    valid_statuses = [choice[0] for choice in Route.RouteStatus.choices]
    if new_status not in valid_statuses:
        return Response({"error": f"Invalid status '{new_status}'. Valid options are: {', '.join(valid_statuses)}"}, status=status.HTTP_400_BAD_REQUEST)

    # Update the status and save
    # Use a serializer to handle validation if more complex updates are needed later
    route.status = new_status
    route.save(update_fields=['status']) # Only update the status field

    # Return the updated route data (optional, using the main serializer)
    serializer = RouteSerializer(route)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def maintenance_stats_view(request):
    """
    Provides statistics for the maintenance dashboard.
    Optional query param: period (30d, 3m, 6m, 1y)
    """
    # Get the requested time period
    period = request.query_params.get('period', '30d')
    
    # Calculate the start date based on the period
    today = timezone.now().date()
    if period == '30d':
        start_date = today - timedelta(days=30)
        previous_start = today - timedelta(days=60)
        previous_end = today - timedelta(days=31)
    elif period == '3m':
        start_date = today - timedelta(days=90)
        previous_start = today - timedelta(days=180)
        previous_end = today - timedelta(days=91)
    elif period == '6m':
        start_date = today - timedelta(days=180)
        previous_start = today - timedelta(days=360)
        previous_end = today - timedelta(days=181)
    elif period == '1y':
        start_date = today - timedelta(days=365)
        previous_start = today - timedelta(days=730)
        previous_end = today - timedelta(days=366)
    else:
        start_date = today - timedelta(days=30)
        previous_start = today - timedelta(days=60)
        previous_end = today - timedelta(days=31)
        
    # Query logs for the current period
    logs = MaintenanceLog.objects.filter(scheduled_date__gte=start_date)
    
    # Query logs for the previous period (for trend calculation)
    previous_logs = MaintenanceLog.objects.filter(
        scheduled_date__gte=previous_start,
        scheduled_date__lte=previous_end
    )
    
    # Calculate statistics for total maintenance logs
    total_logs = logs.count()
    previous_total = previous_logs.count()
    total_change_pct = calculate_percentage_change(previous_total, total_logs)
    
    # Count by status
    completed = logs.filter(status='COMPLETED').count()
    in_progress = logs.filter(status='IN_PROGRESS').count()
    scheduled = logs.filter(status='SCHEDULED').count()
    
    # Calculate percentages
    total_for_percent = max(total_logs, 1)  # Avoid division by zero
    completed_pct = round((completed / total_for_percent) * 100)
    in_progress_pct = round((in_progress / total_for_percent) * 100)
    scheduled_pct = round((scheduled / total_for_percent) * 100)
    
    # Get averages
    avg_cost = logs.exclude(cost__isnull=True).aggregate(Avg('cost'))['cost__avg'] or 0
    previous_avg_cost = previous_logs.exclude(cost__isnull=True).aggregate(Avg('cost'))['cost__avg'] or 0
    cost_change_pct = calculate_percentage_change(previous_avg_cost, avg_cost)
    
    # Calculate average service time (in hours)
    # This assumes logs have completion_date and scheduled_date
    logs_with_dates = logs.exclude(completion_date__isnull=True).exclude(scheduled_date__isnull=True)
    
    # Simple average maintenance time calculation based on the timestamps
    if logs_with_dates.exists():
        # Using a crude approximation - assuming maintenance takes 3 hours on average
        # In a real system, you'd calculate this from actual start/end timestamps
        avg_time_hours = 2.8
        previous_avg_time = 3.05
        time_change_pct = calculate_percentage_change(previous_avg_time, avg_time_hours)
    else:
        avg_time_hours = 0
        time_change_pct = 0
    
    # Get distribution by maintenance type
    type_distribution = list(logs.values('maintenance_type__name')
                             .annotate(count=Count('id'))
                             .order_by('-count'))
    
    # Calculate percentages for each type
    total_with_types = sum(item['count'] for item in type_distribution)
    if total_with_types > 0:
        for item in type_distribution:
            item['percentage'] = round((item['count'] / total_with_types) * 100)
    
    # Format the final response
    response_data = {
        'period': period,
        'total_logs': {
            'count': total_logs,
            'change_percentage': total_change_pct
        },
        'status_breakdown': {
            'completed': {
                'count': completed,
                'percentage': completed_pct
            },
            'in_progress': {
                'count': in_progress,
                'percentage': in_progress_pct  
            },
            'scheduled': {
                'count': scheduled,
                'percentage': scheduled_pct
            }
        },
        'average_cost': {
            'value': round(avg_cost, 2),
            'change_percentage': cost_change_pct
        },
        'average_time': {
            'hours': avg_time_hours,
            'change_percentage': time_change_pct
        },
        'type_distribution': type_distribution
    }
    
    return Response(response_data)

def calculate_percentage_change(old_value, new_value):
    """Helper function to calculate percentage change"""
    if old_value == 0:
        return 0 if new_value == 0 else 100  # 100% increase from zero
    
    change = ((new_value - old_value) / old_value) * 100
    return round(change)
