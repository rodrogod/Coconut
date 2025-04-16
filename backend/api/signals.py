from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db.models import F # For atomic updates
from .models import Route, Vehicle, UserProfile, User

@receiver(post_save, sender=Route)
def update_odometer_on_route_completion(sender, instance, created, **kwargs):
    """
    Updates the vehicle's odometer when a Route's status is set to COMPLETED.
    Uses pre_save signal checking to see if the status *changed* to COMPLETED.
    """
    # We need to know the previous state, which post_save doesn't provide easily.
    # A common pattern is to store the old state on the instance in pre_save,
    # or query the DB for the old state (less efficient).
    # Let's try a simpler approach first: check if the status IS completed
    # and assume we only want to add distance once. This might double-add if
    # a completed route is saved again for other reasons.

    # A more robust approach uses pre_save to track the change:
    # See pre_save receiver below.

    pass # Keep post_save empty for now, logic moved to pre_save check

# Store the original status before saving
_original_route_status = {}

@receiver(pre_save, sender=Route)
def store_original_route_status(sender, instance, **kwargs):
    """Stores the original status of the route before it's saved."""
    if instance.pk: # Only store for existing instances being updated
        try:
            _original_route_status[instance.pk] = Route.objects.get(pk=instance.pk).status
        except Route.DoesNotExist:
            _original_route_status[instance.pk] = None # Handle case where it might be deleted concurrently? Unlikely here.
    else: # New instance
         _original_route_status[instance.pk] = None


@receiver(post_save, sender=Route)
def update_odometer_on_status_change(sender, instance, created, **kwargs):
    """
    Checks if the status changed to COMPLETED and updates odometer.
    """
    if not created and instance.pk in _original_route_status:
        original_status = _original_route_status.pop(instance.pk) # Get and remove old status
        if original_status != Route.RouteStatus.COMPLETED and instance.status == Route.RouteStatus.COMPLETED:
            # Status just changed to COMPLETED
            print(f"Route {instance.id} completed. Updating odometer for vehicle {instance.vehicle.id}")
            vehicle = instance.vehicle
            route_distance = instance.total_distance_km or 0

            if route_distance > 0:
                # Use F() expression for atomic update to avoid race conditions
                Vehicle.objects.filter(pk=vehicle.pk).update(
                    current_odometer_km=F('current_odometer_km') + route_distance
                )
                print(f"Updated odometer for vehicle {vehicle.license_plate} by {route_distance} km.")
            else:
                print(f"Route {instance.id} has zero distance. Odometer not updated.")


# Signal to create UserProfile when a new User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        print(f"UserProfile created for user {instance.username}")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Ensure profile is saved when user is saved (e.g., if email changes)
    # This might not be strictly necessary depending on how profiles are managed
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
         # If profile doesn't exist (e.g., for users created before signal), create it
         UserProfile.objects.create(user=instance)
         print(f"UserProfile created for existing user {instance.username} during save.")