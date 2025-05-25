"""
Authentication middleware for the Metal-Rezerv API.
Provides token validation and user role verification.
"""

import jwt
from functools import wraps
from flask import request, jsonify, current_app

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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
            
            # Create current_user object
            current_user = {
                'id': payload['sub'],
                'role': payload['role']
            }
            
            return f(current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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
            
            # Check if user is admin
            if payload['role'] != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
            
            # Create current_user object
            current_user = {
                'id': payload['sub'],
                'role': payload['role']
            }
            
            return f(current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated
