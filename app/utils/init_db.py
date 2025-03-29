# app/utils/init_db.py
from app import create_app, db
from app.models import User, Role
from datetime import datetime

def init_db():
    app = create_app()
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if admin exists
        admin = User.query.filter_by(role=Role.ADMIN).first()
        if not admin:
            # Create admin user
            admin = User(
                username='admin@quizmaster.com',
                full_name='Quiz Master Admin',
                role=Role.ADMIN
            )
            admin.set_password('adminpassword')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")

if __name__ == '__main__':
    init_db()