import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# Get configuration from environment or use defaults
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)

celery_app = Celery(
    'quiz_master',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        'app.tasks.reminder_tasks', 
        'app.tasks.report_tasks',
        'app.tasks.export_tasks'  # Add this line
    ]
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Configure the schedule
celery_app.conf.beat_schedule = {
    'send-daily-reminders': {
        'task': 'app.tasks.reminder_tasks.send_daily_reminders',
        'schedule': crontab(hour=18, minute=0),
    },
    'send-monthly-reports': {
        'task': 'app.tasks.report_tasks.send_monthly_reports',
        'schedule': crontab(day_of_month=1, hour=8, minute=0),
    },
}