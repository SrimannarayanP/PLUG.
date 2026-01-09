# celery.py


import os

from celery import Celery


# Setting default settings to Django project settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# This tells Celery: "Look at Django's settings.py file." namespace = 'CELERY' means it will only read variables that start with 'CELERY_' like 'CELERY_BROKER_URL'
app.config_from_object('django.conf:settings', namespace = 'CELERY')

# It tells Celery to look through every installed app & automatically find a file named 'tasks.py'. If this wasn't there, we'd have to manually import every task here.
app.autodiscover_tasks()
