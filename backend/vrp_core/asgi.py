"""
ASGI config for vrp_core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from dotenv import load_dotenv # Import load_dotenv

load_dotenv() # Load environment variables from .env file
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vrp_core.settings')

application = get_asgi_application()
