# app/api/auth.py
from flask import request, jsonify
# from werkzeug.urls import url_parse
from flask_login import login_user, logout_user, current_user
from urllib.parse import urlparse

from app.models import User, Role
from app import db
from app.api import api_bp
from datetime import datetime



@api_bp.route('/auth/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return jsonify({'message': 'Already logged in'}), 400
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    login_user(user)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    })



@api_bp.route('/auth/register', methods=['POST'])
def register():
    if current_user.is_authenticated:
        return jsonify({'message': 'Already logged in'}), 400
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    qualification = data.get('qualification')
    dob_str = data.get('dob')
    
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    dob = None
    if dob_str:
        try:
            dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format for dob'}), 400
    
    user = User(
        username=username,
        full_name=full_name,
        qualification=qualification,
        dob=dob,
        role=Role.USER
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict()
    }), 201



@api_bp.route('/auth/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'})


@api_bp.route('/auth/current_user', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    else:
        return jsonify({
            'authenticated': False
        })