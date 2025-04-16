"""
Core VRP Solver using Google OR-Tools and Google Maps API.
"""
import googlemaps
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import time # Added for caching timestamp
from django.conf import settings
from .models import Location, Vehicle, Task # Import necessary models

# TODO: Add error handling and logging

# Simple in-memory cache for distance matrix results
distance_matrix_cache = {}
CACHE_DURATION_SECONDS = 3600 # Cache results for 1 hour

def get_google_maps_client():
    """Initializes and returns a Google Maps client."""
    # Ensure GOOGLE_MAPS_API_KEY is set in Django settings
    if not hasattr(settings, 'GOOGLE_MAPS_API_KEY') or not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY not configured in Django settings.")
    return googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

def create_distance_matrix(client, addresses):
    """
    Calculates the distance and duration matrix using Google Maps API, with caching.
    Args:
        client: Initialized googlemaps.Client instance.
        addresses: A list of address strings or (lat, lng) tuples.
    Returns:
        A tuple containing two lists of lists: (distance_matrix, duration_matrix).
        Distances are in meters, durations are in seconds.
    """
    # Create a stable cache key from sorted addresses (assuming addresses are hashable tuples like lat/lng)
    # Convert list of tuples to tuple of tuples for hashing
    try:
        # Ensure addresses are tuples if they aren't already, then sort
        sorted_addresses = tuple(sorted(tuple(addr) for addr in addresses))
    except TypeError:
        # Handle cases where addresses might not be directly sortable/hashable (e.g., complex objects)
        # For simplicity, we'll skip caching if the key can't be made easily.
        # A more robust solution might involve using IDs or a custom hashing function.
        print("Warning: Could not create cache key for addresses. Skipping cache.")
        sorted_addresses = None

    current_time = time.time()

    # Check cache first
    if sorted_addresses and sorted_addresses in distance_matrix_cache:
        cached_time, cached_dist_matrix, cached_dur_matrix = distance_matrix_cache[sorted_addresses]
        if current_time - cached_time < CACHE_DURATION_SECONDS:
            print(f"Cache hit for {len(addresses)} addresses. Using cached distance matrix.")
            return cached_dist_matrix, cached_dur_matrix
        else:
            print(f"Cache expired for {len(addresses)} addresses.")
            # Remove expired entry
            del distance_matrix_cache[sorted_addresses]

    print(f"Cache miss or expired. Calling Google Maps API for {len(addresses)} addresses.")
    try:
        # Call Google Maps API
        matrix = client.distance_matrix(origins=addresses, destinations=addresses, mode="driving")
        # TODO: Handle potential errors from the API response (e.g., ZERO_RESULTS)

        num_locations = len(addresses)
        distance_matrix = [[0] * num_locations for _ in range(num_locations)]
        duration_matrix = [[0] * num_locations for _ in range(num_locations)]

        for i in range(num_locations):
            for j in range(num_locations):
                if matrix['rows'][i]['elements'][j]['status'] == 'OK':
                    distance_matrix[i][j] = matrix['rows'][i]['elements'][j]['distance']['value'] # meters
                    duration_matrix[i][j] = matrix['rows'][i]['elements'][j]['duration']['value'] # seconds
                else:
                    # Handle cases where a route is not found (e.g., set a very high cost)
                    # For now, let's raise an error or use a large number
                    print(f"Warning: Could not find route between {addresses[i]} and {addresses[j]}. Status: {matrix['rows'][i]['elements'][j]['status']}")
                    # Using a large number might be better for the solver than 0
                    large_number = 999999999 # Represents a very high cost/time
                    distance_matrix[i][j] = large_number
                    duration_matrix[i][j] = large_number

        # Store result in cache if key was created
        if sorted_addresses:
            distance_matrix_cache[sorted_addresses] = (current_time, distance_matrix, duration_matrix)
            print(f"Stored distance matrix for {len(addresses)} addresses in cache.")

        return distance_matrix, duration_matrix
    except googlemaps.exceptions.ApiError as e:
        print(f"Google Maps API Error: {e}")
        # Handle API errors appropriately (e.g., raise exception, return None)
        raise
    except Exception as e:
        print(f"Error creating distance matrix: {e}")
        raise


def solve_vrp(depot_location: Location, tasks: list[Task], vehicles: list[Vehicle]):
    """
    Main function to solve the Vehicle Routing Problem.
    Args:
        depot_location: The Location object representing the depot.
        tasks: A list of Task objects to be scheduled.
        vehicles: A list of Vehicle objects available for routing.
    Returns:
        A dictionary containing the solution routes, or None if no solution found.
        Example structure:
        {
            'routes': [
                {
                    'vehicle_id': vehicle.id,
                    'stops': [
                        {'location_id': stop_location.id, 'task_id': task.id or None, 'type': 'START_DEPOT'/'PICKUP'/'DELIVERY'/'END_DEPOT', ...},
                        ...
                    ],
                    'total_distance_meters': ...,
                    'total_duration_seconds': ...
                },
                ...
            ],
            'dropped_tasks': [task.id, ...] # Tasks that couldn't be assigned
        }
    """
    print(f"Starting VRP solver for {len(tasks)} tasks and {len(vehicles)} vehicles.")

    if not tasks or not vehicles:
        print("No tasks or vehicles provided.")
        return None

    gmaps = get_google_maps_client()

    # --- 1. Prepare Data for OR-Tools ---
    # Combine depot and all unique task locations (origins and destinations)
    # The order matters: index 0 is typically the depot.
    location_map = {depot_location.id: depot_location} # Track locations by ID
    locations_for_matrix = [depot_location]
    task_indices_map = {} # Map task ID to its index(es) in the matrix

    # Add unique task locations (origins and destinations)
    # Add unique task locations
    for task in tasks:
        if task.origin_id not in location_map:
            location_map[task.origin_id] = task.origin
            locations_for_matrix.append(task.origin)
        if task.destination_id not in location_map:
            location_map[task.destination_id] = task.destination
            locations_for_matrix.append(task.destination)

    # Create addresses list for Google Maps API
    # Using lat/lng is generally more reliable than addresses
    addresses = [(loc.latitude, loc.longitude) for loc in locations_for_matrix]
    num_locations = len(locations_for_matrix)
    location_index_map = {loc.id: i for i, loc in enumerate(locations_for_matrix)} # Map location ID to matrix index

    print(f"Number of unique locations (incl. depot): {num_locations}")
    if num_locations <= 1:
        print("Not enough locations for routing.")
        return None

    # --- 2. Get Distance/Duration Matrix ---
    try:
        distance_matrix, duration_matrix = create_distance_matrix(gmaps, addresses)
        print("Distance and duration matrices obtained.")
    except Exception as e:
        print(f"Failed to get distance/duration matrix: {e}")
        return None # Cannot proceed without the matrix

    # --- 3. Create OR-Tools Data Model ---
    data = {}
    data['distance_matrix'] = distance_matrix
    # We need travel time + service time for the time dimension
    # Service times are per location. Add them to the duration matrix diagonal? No, add during dimension setup.
    data['time_matrix'] = duration_matrix
    data['num_vehicles'] = len(vehicles)
    data['depot'] = 0 # Index of the depot in our locations_for_matrix

    # Demands (Weight and Volume) - For Pickup & Delivery, this is more complex.
    # Let's handle simple delivery first: demand is at the destination.
    # For P&D, need pairs: pickup index, delivery index.
    # We'll need to map tasks to matrix indices.
    # Example for simple delivery demands (at destination index):
    demands_weight = [0] * num_locations
    demands_volume = [0] * num_locations
    pickup_delivery_pairs = [] # For P&D constraint

    # Process Tasks for demands and P&D pairs
    for task in tasks:
        origin_idx = location_index_map.get(task.origin_id)
        dest_idx = location_index_map.get(task.destination_id)

        if origin_idx is None or dest_idx is None:
            print(f"Warning: Could not find index for task {task.id} locations. Skipping task.")
            continue

        # Simple Delivery/Pickup demand model (adjust if using P&D constraint)
        if task.type == Task.TaskType.DELIVERY:
            # Convert demands to integers
            demands_weight[dest_idx] += int(task.weight_kg or 0)
            demands_volume[dest_idx] += int(task.volume_m3 or 0)
        elif task.type == Task.TaskType.PICKUP:
            # For pickup, demand is negative at origin? Or positive? Depends on constraint setup.
            # Let's assume positive demand means "needs to be picked up/delivered".
            # OR-Tools P&D example uses demand at both locations.
            # Let's use the P&D approach:
            # Convert demands to integers
            demands_weight[origin_idx] += int(task.weight_kg or 0) # Pickup adds demand
            demands_volume[origin_idx] += int(task.volume_m3 or 0)
            demands_weight[dest_idx] -= int(task.weight_kg or 0) # Delivery removes demand
            demands_volume[dest_idx] -= int(task.volume_m3 or 0)

        # Store pickup/delivery pairs for P&D constraint
        pickup_delivery_pairs.append((origin_idx, dest_idx))
        task_indices_map[task.id] = {'pickup': origin_idx, 'delivery': dest_idx}


    data['demands_weight'] = demands_weight
    data['demands_volume'] = demands_volume
    # Convert vehicle capacities to integers
    data['vehicle_capacities_weight'] = [int(v.type.max_weight_kg or 0) for v in vehicles]
    data['vehicle_capacities_volume'] = [int(v.type.max_volume_m3 or 0) for v in vehicles]

    # Time Windows
    # OR-Tools expects time windows as (start_time, end_time) tuples in seconds from midnight
    # or a consistent epoch if spanning multiple days (not handled here yet).
    # For now, assume single day, convert HH:MM to seconds.
    time_windows = [(0, 86400)] * num_locations # Default: open all day (0 to 24*3600 seconds)
    # Apply time windows based on Location model's opening/closing times
    print("Applying location time windows:")
    for i, loc in enumerate(locations_for_matrix):
        if i == data['depot']:
            # Set a wide window for the depot, e.g., 8 AM to 6 PM (adjust as needed)
            # Or leave as full day if vehicles can start/end anytime
            depot_start_seconds = 8 * 3600 # 8 AM
            depot_end_seconds = 18 * 3600 # 6 PM
            time_windows[i] = (depot_start_seconds, depot_end_seconds)
            print(f"  - Depot ({loc.name}): {depot_start_seconds}s - {depot_end_seconds}s")
            continue

        start_sec = 0
        end_sec = 86400 # Default to full day

        if loc.opening_time:
            start_sec = loc.opening_time.hour * 3600 + loc.opening_time.minute * 60 + loc.opening_time.second
        if loc.closing_time:
            # Ensure closing time is after opening time, handle overnight if necessary (not done here)
            end_sec = loc.closing_time.hour * 3600 + loc.closing_time.minute * 60 + loc.closing_time.second
            if end_sec < start_sec: # Basic check, assumes same day
                 print(f"  - Warning: Location {loc.name} closing time {loc.closing_time} is before opening time {loc.opening_time}. Using full day.")
                 end_sec = 86400

        time_windows[i] = (start_sec, end_sec)
        print(f"  - Loc {i} ({loc.name}): {start_sec}s - {end_sec}s")

    data['time_windows'] = time_windows

    # Service times (in seconds)
    service_times = [0] * num_locations
    for i, loc in enumerate(locations_for_matrix):
        # Convert service times to integers (seconds)
        service_times[i] = int((loc.average_service_time_mins or 0) * 60)

    # --- 4. Create Routing Model ---
    manager = pywrapcp.RoutingIndexManager(num_locations, data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    # --- 5. Define Callbacks and Dimensions ---

    # Distance Callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Time Callback (Travel Time + Service Time)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        # Travel time from matrix + Service time at the 'from' node
        # Service time is incurred *before* leaving the 'from' node for the 'to' node.
        travel_time = data['time_matrix'][from_node][to_node]
        serv_time = service_times[from_node]
        return travel_time + serv_time

    time_callback_index = routing.RegisterTransitCallback(time_callback)

    # Time Dimension (for time windows and route duration limits)
    time_dimension_name = 'Time'
    # Horizon: max time allowed (e.g., 24 hours in seconds)
    # TODO: Make horizon configurable (e.g., working day)
    # Horizon: max time allowed (e.g., 24 hours in seconds) - used for slack calculation
    slack_max = 24 * 3600
    # Max route duration constraint (3 hours in seconds)
    max_route_duration = 10 * 3600 # Increased from 3 hours to 10 hours
    routing.AddDimension(
        time_callback_index,
        slack_max,  # Allow waiting time (slack) up to horizon
        max_route_duration,  # Max time per vehicle route (3 hours)
        False,  # Don't force start cumul to zero, depends on vehicle start time
        time_dimension_name)
    time_dimension = routing.GetDimensionOrDie(time_dimension_name)

    # Add time window constraints for each location node
    for location_idx, time_window in enumerate(data['time_windows']):
        if location_idx == data['depot']:
            continue
        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])

    # Add time window constraints for the depot (start/end of day)
    # Example: Start between 8 AM and 9 AM
    # depot_start_time = 8 * 3600
    # depot_end_time = 18 * 3600 # Example end time
    # for i in range(data['num_vehicles']):
    #     index = routing.Start(i)
    #     time_dimension.CumulVar(index).SetRange(depot_start_time, depot_end_time) # Adjust as needed

    # Add Driver Break Constraint (30 mins around 2 PM)
    break_duration = 30 * 60  # 30 minutes in seconds
    # Define the window when the break *must* occur (e.g., between 1:45 PM and 2:15 PM)
    # Adjust this window as needed. A wider window gives more flexibility.
    break_window_start = (13 * 3600) + (45 * 60) # 1:45 PM
    break_window_end = (14 * 3600) + (15 * 60)   # 2:15 PM

    # Create break intervals for each vehicle
    break_intervals = []
    for i in range(data['num_vehicles']):
        break_interval = routing.solver().FixedDurationIntervalVar(
            break_window_start,  # earliest start time
            break_window_end,    # latest start time
            break_duration,      # duration
            False,               # optionality (False = mandatory)
            f'Break for vehicle {i}'
        )
        break_intervals.append(break_interval)

    # Add the break constraint to the time dimension for each vehicle individually
    # node_visit_transits = [time_callback_index] # Transit callback index wrapped in a list
    # Temporarily commented out break constraint application for debugging
    # for i in range(data['num_vehicles']):
    #     # Apply the break interval created earlier for this specific vehicle index 'i'
    #     vehicle_breaks = [break_intervals[i]] # Get the specific break interval for vehicle i
    #     time_dimension.SetBreakIntervalsOfVehicle(vehicle_breaks, i, node_visit_transits)

    # print(f"Added mandatory {break_duration/60} min break constraint between {break_window_start}s and {break_window_end}s for all vehicles.") # Commented out print statement as well
    #     index = routing.End(i)
    #     time_dimension.CumulVar(index).SetRange(depot_start_time, depot_end_time) # Adjust as needed


    # Capacity Dimensions (Weight and Volume)
    def demand_callback_weight(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands_weight'][from_node]

    demand_callback_weight_index = routing.RegisterUnaryTransitCallback(demand_callback_weight)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_weight_index,
        0,  # Slack zero - capacity cannot be exceeded
        data['vehicle_capacities_weight'],
        True,  # Start cumul to zero
        'CapacityWeight')

    def demand_callback_volume(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands_volume'][from_node]

    demand_callback_volume_index = routing.RegisterUnaryTransitCallback(demand_callback_volume)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_volume_index,
        0,  # Slack zero
        data['vehicle_capacities_volume'],
        True,  # Start cumul to zero
        'CapacityVolume')

    # Pickup and Delivery Constraint
    for request in pickup_delivery_pairs:
        pickup_index = manager.NodeToIndex(request[0])
        delivery_index = manager.NodeToIndex(request[1])
        routing.AddPickupAndDelivery(pickup_index, delivery_index)
        # Ensure same vehicle serves both pickup and delivery
        routing.solver().Add(
            routing.VehicleVar(pickup_index) == routing.VehicleVar(delivery_index))
        # Ensure pickup happens before delivery in the time dimension
        routing.solver().Add(
            time_dimension.CumulVar(pickup_index) <= time_dimension.CumulVar(delivery_index))


    # Allow tasks to be dropped (optional, add penalty)
    # penalty = 100000 # High cost for dropping a task
    # for node in range(1, len(data['distance_matrix'])): # Skip depot
    #     routing.AddDisjunction([manager.NodeToIndex(node)], penalty)


    # --- 6. Set Search Parameters ---
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    # search_parameters.local_search_metaheuristic = (
    #     routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    # search_parameters.time_limit.FromSeconds(30) # Set a time limit

    # --- 7. Solve the Problem ---
    print("Solving VRP...")
    solution = routing.SolveWithParameters(search_parameters)

    # --- 8. Process the Solution ---
    if solution:
        print("Solution found!")
        result = {'routes': [], 'dropped_tasks': []} # Add dropped tasks later if disjunctions used

        total_distance = 0
        total_load = 0 # Example tracking, not used yet
        total_time = 0

        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            route_distance = 0
            route_duration = 0 # Using time dimension
            route_stops = []
            vehicle_obj = vehicles[vehicle_id] # Get the corresponding Vehicle object

            plan_output = f'Route for vehicle {vehicle_obj.license_plate} (ID: {vehicle_obj.id}):\n'

            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                time_var = time_dimension.CumulVar(index)
                location_obj = locations_for_matrix[node_index] # Get Location object

                # Determine stop type and associated task(s)
                stop_type = 'UNKNOWN'
                task_id = None
                if node_index == data['depot']:
                    stop_type = 'START_DEPOT' if routing.IsStart(index) else 'END_DEPOT'
                else:
                    # Find task associated with this stop (this logic might need refinement for P&D)
                    # A stop might be a pickup OR a delivery.
                    # Check if this node_index is a pickup or delivery for any task
                    is_pickup = any(p_idx == node_index for p_idx, d_idx in pickup_delivery_pairs)
                    is_delivery = any(d_idx == node_index for p_idx, d_idx in pickup_delivery_pairs)

                    # Simple assumption: if it's a pickup node, type is PICKUP, if delivery, type is DELIVERY
                    # This breaks if a location is both pickup for Task A and delivery for Task B on same route.
                    # A better way might be to link the stop directly to the task it serves.
                    # For now, let's try to find the task based on index:
                    current_task = None
                    for t_id, indices in task_indices_map.items():
                        if indices['pickup'] == node_index:
                            stop_type = 'PICKUP'
                            task_id = t_id
                            break
                        elif indices['delivery'] == node_index:
                            stop_type = 'DELIVERY'
                            task_id = t_id
                            break

                route_stops.append({
                    'location_id': location_obj.id,
                    'location_name': location_obj.name,
                    'task_id': task_id,
                    'type': stop_type,
                    'arrival_time_seconds': solution.Min(time_var),
                    'departure_time_seconds': solution.Max(time_var), # Max includes service time? Check OR-Tools docs
                    # Add load, distance etc. later
                })

                plan_output += f' {location_obj.name} (Time={solution.Min(time_var)}s -> {solution.Max(time_var)}s) ->'
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                # Route duration calculation needs care - use time dimension difference?
                # route_duration += time_callback(previous_index, index) # This includes service time

            # Add the final depot stop
            node_index = manager.IndexToNode(index)
            time_var = time_dimension.CumulVar(index)
            location_obj = locations_for_matrix[node_index]
            route_stops.append({
                'location_id': location_obj.id,
                'location_name': location_obj.name,
                'task_id': None,
                'type': 'END_DEPOT',
                'arrival_time_seconds': solution.Min(time_var),
                'departure_time_seconds': solution.Max(time_var),
            })

            plan_output += f' {location_obj.name} (Time={solution.Min(time_var)}s -> {solution.Max(time_var)}s)\n'
            route_duration = solution.Min(time_dimension.CumulVar(index)) # Total time for this route
            plan_output += f'Distance of the route: {route_distance}m\n'
            plan_output += f'Time of the route: {route_duration}s\n'
            print(plan_output)

            # Only add routes that actually have stops besides depot start/end
            if len(route_stops) > 2:
                 result['routes'].append({
                     'vehicle_id': vehicle_obj.id,
                     'stops': route_stops,
                     'total_distance_meters': route_distance,
                     'total_duration_seconds': route_duration,
                 })
                 total_distance += route_distance
                 total_time += route_duration # Summing route times might not be meaningful

        print(f'Total distance of all routes: {total_distance}m')
        # print(f'Total time of all routes: {total_time}s') # Less meaningful metric

        # Identify dropped tasks if using disjunctions
        # for node in range(routing.Size()):
        #     if routing.IsStart(node) or routing.IsEnd(node):
        #         continue
        #     if solution.Value(routing.NextVar(node)) == node:
        #         # Find task corresponding to this node index
        #         # ... logic to map node index back to task ID ...
        #         # result['dropped_tasks'].append(task_id)
        #         print(f'Task at node {manager.IndexToNode(node)} was dropped.')

        return result
    else:
        print('No solution found!')
        return None

# Example Usage (for testing purposes, call this from a manage.py shell or test)
# if __name__ == '__main__':
#     # This part needs Django context to run (manage.py shell)
#     # Fetch sample data
#     depot = Location.objects.get(type=Location.LocationType.CEDIS)
#     tasks_to_plan = list(Task.objects.filter(status=Task.TaskStatus.PENDING))
#     available_vehicles = list(Vehicle.objects.filter(is_available=True))
#
#     if depot and tasks_to_plan and available_vehicles:
#         solution = solve_vrp(depot, tasks_to_plan, available_vehicles)
#         if solution:
#             print("\n--- Solution Summary ---")
#             # Process/print the structured solution dictionary
#             for i, route in enumerate(solution['routes']):
#                 print(f"\nRoute {i+1} (Vehicle ID: {route['vehicle_id']})")
#                 print(f"  Distance: {route['total_distance_meters']}m, Duration: {route['total_duration_seconds']}s")
#                 for stop in route['stops']:
#                     print(f"  - Stop: Loc ID {stop['location_id']} ({stop['location_name']}), Type: {stop['type']}, Task: {stop['task_id']}, Arr: {stop['arrival_time_seconds']}s, Dep: {stop['departure_time_seconds']}s")
#             # print(f"\nDropped Tasks: {solution.get('dropped_tasks', [])}")
#     else:
#         print("Could not fetch necessary data for VRP test run.")