from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from backend.models.models import User, Subject, Chapter, Quiz, Question
from backend.extensions import db
from functools import wraps

admin_bp = Blueprint('admin', __name__)

# Admin authorization decorator
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

# User management routes
@admin_bp.route('/users', methods=['GET'])
@login_required
@admin_required
def get_users():
    users = User.query.filter_by(role='user').all()
    return jsonify([{
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'qualification': user.qualification,
        'dob': user.dob.strftime('%Y-%m-%d') if user.dob else None,
        'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for user in users]), 200

# Subject management routes
@admin_bp.route('/subjects', methods=['GET'])
@login_required
@admin_required
def get_subjects():
    subjects = Subject.query.all()
    return jsonify([{
        'id': subject.id,
        'name': subject.name,
        'description': subject.description,
        'created_at': subject.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for subject in subjects]), 200

@admin_bp.route('/subjects', methods=['POST'])
@login_required
@admin_required
def create_subject():
    data = request.get_json()
    
    subject = Subject(
        name=data.get('name'),
        description=data.get('description')
    )
    
    db.session.add(subject)
    db.session.commit()
    
    return jsonify({
        'id': subject.id,
        'name': subject.name,
        'description': subject.description,
        'created_at': subject.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 201

# Add more routes for subjects, chapters, quizzes, etc.

@admin_bp.route('/subjects/<int:subject_id>', methods=['PUT'])
@admin_required
def update_subject(subject_id):
    data = request.get_json()
    subject = Subject.query.get_or_404(subject_id)
    
    subject.name = data.get('name', subject.name)
    subject.description = data.get('description', subject.description)
    
    db.session.commit()
    
    return jsonify({
        'id': subject.id,
        'name': subject.name,
        'description': subject.description,
        'created_at': subject.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 200

@admin_bp.route('/subjects/<int:subject_id>', methods=['DELETE'])
@admin_required
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    
    db.session.delete(subject)
    db.session.commit()
    
    return jsonify({'message': 'Subject deleted successfully'}), 200

# Similar routes would be added for chapters, quizzes, and questions
# For brevity, these are not included here but would follow the same pattern