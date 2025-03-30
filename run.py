# run.py
from app import create_app
from app.extensions import db
from app.models import User, Role
from werkzeug.security import generate_password_hash
import os

app = create_app()

exports_dir = os.path.join(app.static_folder, 'exports')
os.makedirs(exports_dir, exist_ok=True)
# Initialize database within app context
with app.app_context():
    db.create_all()
    print("Database schema updated!")
    # Check if admin exists
    admin = User.query.filter_by(role=Role.ADMIN).first()
    if not admin:
        admin = User(
            username='admin@quizmaster.com',
            full_name='Quiz Master Admin',
            role=Role.ADMIN,
            password_hash=generate_password_hash('adminpassword')
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully")

if __name__ == '__main__':
    app.run(debug=True)