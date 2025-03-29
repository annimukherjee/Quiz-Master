# app/celery_config.py
from app import create_app

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery



flask_app = create_app()
celery = make_celery(flask_app)

# Set up periodic tasks
@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Send daily reminders at 6:00 PM every day
    sender.add_periodic_task(
        crontab(hour=18, minute=0),
        send_daily_reminders.s(),
        name='Send daily quiz reminders'
    )
    
    # Send monthly reports on the 1st of each month at 8:00 AM
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=8, minute=0),
        send_monthly_reports.s(),
        name='Send monthly performance reports'
    )