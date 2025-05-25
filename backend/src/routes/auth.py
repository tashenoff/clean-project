"""
Authentication routes for the Metal-Rezerv API.
Handles user registration (two-step process), login, and token validation.
"""

import sqlite3
import jwt
import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import os

auth_bp = Blueprint('auth', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Generate JWT token
def generate_token(user_id, role):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id,
        'role': role
    }
    return jwt.encode(
        payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )

# Step 1: Register user
@auth_bp.route('/register/step1', methods=['POST'])
def register_step1():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'role', 'phone', 'city', 'country']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate role
    valid_roles = ['customer', 'executor']
    if data['role'] not in valid_roles:
        return jsonify({'error': 'Invalid role. Must be either "customer" or "executor"'}), 400
    
    conn = get_db_connection()
    try:
        # Check if user already exists
        user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
        if user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Insert user
        cursor = conn.execute(
            'INSERT INTO users (email, password, role, phone, city, country) VALUES (?, ?, ?, ?, ?, ?)',
            (data['email'], hashed_password, data['role'], data['phone'], data['city'], data['country'])
        )
        user_id = cursor.lastrowid
        
        # If user is executor, create executor profile
        if data['role'] == 'executor':
            conn.execute(
                'INSERT INTO executor_profiles (user_id, experience_level, points) VALUES (?, ?, ?)',
                (user_id, 'BEGINNER', 0)
            )
        
        conn.commit()
        
        # Generate token
        token = generate_token(user_id, data['role'])
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'token': token,
            'role': data['role']
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Step 2: Register company
@auth_bp.route('/register/step2', methods=['POST'])
def register_step2():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'company_name', 'bin', 'address']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    try:
        # Check if user exists
        user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Insert company
        cursor = conn.execute(
            'INSERT INTO companies (name, bin, address, status) VALUES (?, ?, ?, ?)',
            (data['company_name'], data['bin'], data['address'], 'pending')
        )
        company_id = cursor.lastrowid
        
        # Link user to company as owner
        conn.execute(
            'INSERT INTO company_users (company_id, user_id, role) VALUES (?, ?, ?)',
            (company_id, data['user_id'], 'owner')
        )
        
        conn.commit()
        
        return jsonify({
            'message': 'Company registered successfully',
            'company_id': company_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    conn = get_db_connection()
    try:
        # Get user
        user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
        
        # Check if user exists and password is correct
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate token
        token = generate_token(user['id'], user['role'])
        
        # Get user's company if exists
        company = conn.execute(
            '''
            SELECT c.* FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = ?
            ''',
            (user['id'],)
        ).fetchone()
        
        # Get executor profile if user is executor
        executor_profile = None
        if user['role'] == 'executor':
            executor_profile = conn.execute(
                'SELECT * FROM executor_profiles WHERE user_id = ?',
                (user['id'],)
            ).fetchone()
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'phone': user['phone'],
                'city': user['city'],
                'country': user['country'],
                'company': dict(company) if company else None,
                'executor_profile': dict(executor_profile) if executor_profile else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Verify token
@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode token
        payload = jwt.decode(
            token,
            current_app.config.get('SECRET_KEY'),
            algorithms=['HS256']
        )
        
        # Get user
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (payload['sub'],)).fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user_id': payload['sub'],
            'role': payload['role']
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
