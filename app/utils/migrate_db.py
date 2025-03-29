# app/utils/migrate_db.py
from app import create_app, db
from app.models import UserAnswer
from sqlalchemy import inspect

def migrate_db():
    app = create_app()
    with app.app_context():
        # Create an inspector
        inspector = inspect(db.engine)
        
        # Check if the UserAnswer table exists
        existing_tables = inspector.get_table_names()
        print(f"Existing tables: {existing_tables}")
        
        if 'user_answer' not in existing_tables:
            print("Creating UserAnswer table...")
            db.create_all()
            print("UserAnswer table created successfully.")
        else:
            print("UserAnswer table already exists.")

if __name__ == '__main__':
    migrate_db()