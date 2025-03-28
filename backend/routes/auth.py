from flask import Blueprint, request, jsonify, redirect, url_for, render_template, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from backend.models.models import User
from backend.extensions import db
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if user already exists
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'User already exists'}), 400
    
    # Create new user
    try:
        user = User(
            email=data.get('email'),
            full_name=data.get('full_name'),
            qualification=data.get('qualification'),
            dob=datetime.strptime(data.get('dob'), '%Y-%m-%d') if data.get('dob') else None,
            role='user'  # Default role is user
        )
        user.set_password(data.get('password'))
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error registering user: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not user.check_password(data.get('password')):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Log the user in
    login_user(user)
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
    }), 200

@auth_bp.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not user.check_password(data.get('password')) or not user.is_admin:
        return jsonify({'message': 'Invalid admin credentials'}), 401
    
    # Log the admin in
    login_user(user)
    
    return jsonify({
        'message': 'Admin login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'full_name': current_user.full_name,
        'qualification': current_user.qualification,
        'dob': current_user.dob.strftime('%Y-%m-%d') if current_user.dob else None,
        'role': current_user.role
    }), 200