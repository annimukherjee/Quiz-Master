# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from flask_cors import CORS

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()
cors = CORS()

def init_extensions(app):
    """Initialize all Flask extensions"""
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    
    # Set up login manager
    login_manager.login_view = 'auth.login'
    
    from app.models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))