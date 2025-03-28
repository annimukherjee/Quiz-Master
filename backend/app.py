from flask import Flask
from backend.config import Config
from backend.extensions import db, migrate, login_manager, mail, cors
from celery import Celery

def create_celery_app(app=None):
    app = app or create_app()
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

def create_app(config_class=Config):
    app = Flask(__name__, 
                static_folder='../frontend/static',
                template_folder='../frontend/templates')
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    cors.init_app(app)
    
    # User loader for Flask-Login
    from backend.models.models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.admin import admin_bp
    from backend.routes.user import user_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    
    # Create all database tables
    with app.app_context():
        db.create_all()
        
        # Create admin user if it doesn't exist
        from backend.models.models import User
        from datetime import datetime
        admin = User.query.filter_by(email='admin@quizmaster.com').first()
        if not admin:
            admin = User(
                email='admin@quizmaster.com',
                full_name='Admin User',
                role='admin',
                dob=datetime.strptime('2000-01-01', '%Y-%m-%d')
            )
            admin.set_password('admin123')  # Set a default password
            db.session.add(admin)
            db.session.commit()
    
    # Simple route to serve the main page
    @app.route('/')
    def index():
        from flask import render_template
        return render_template('index.html')
    
    return app

# Create the app
app = create_app()
celery = create_celery_app(app)