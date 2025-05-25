"""
User management routes for the Metal-Rezerv API.
Handles user profile operations, settings, and user-specific data.
"""

import sqlite3
import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from src.utils.auth_middleware import token_required

users_bp = Blueprint('users', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Get user profile
@users_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    conn = get_db_connection()
    try:
        # Get user data
        user = conn.execute('SELECT id, email, role, phone, city, country, created_at FROM users WHERE id = ?', 
                           (current_user['id'],)).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get company data if exists
        company = conn.execute('''
            SELECT c.* FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = ?
        ''', (current_user['id'],)).fetchone()
        
        # Get executor profile if user is executor
        executor_profile = None
        if user['role'] == 'executor':
            executor_profile = conn.execute(
                'SELECT * FROM executor_profiles WHERE user_id = ?',
                (current_user['id'],)
            ).fetchone()
        
        # Convert to dict for JSON serialization
        user_dict = dict(user)
        company_dict = dict(company) if company else None
        executor_dict = dict(executor_profile) if executor_profile else None
        
        # Remove password from user dict
        if 'password' in user_dict:
            del user_dict['password']
        
        return jsonify({
            'user': user_dict,
            'company': company_dict,
            'executor_profile': executor_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update user profile
@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    # Fields that can be updated
    allowed_fields = ['phone', 'city', 'country']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Build SQL query dynamically
    fields = ', '.join([f"{field} = ?" for field in update_data.keys()])
    values = list(update_data.values())
    values.append(current_user['id'])
    
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE users SET {fields} WHERE id = ?", values)
        conn.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Change password
@users_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Missing current or new password'}), 400
    
    conn = get_db_connection()
    try:
        # Get current password
        user = conn.execute('SELECT password FROM users WHERE id = ?', 
                           (current_user['id'],)).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if current password is correct
        if not check_password_hash(user['password'], data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Update password
        hashed_password = generate_password_hash(data['new_password'])
        conn.execute('UPDATE users SET password = ? WHERE id = ?', 
                    (hashed_password, current_user['id']))
        conn.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Delete account
@users_bp.route('/delete-account', methods=['DELETE'])
@token_required
def delete_account(current_user):
    conn = get_db_connection()
    try:
        # Delete user (cascade will delete related records)
        conn.execute('DELETE FROM users WHERE id = ?', (current_user['id'],))
        conn.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user activity
@users_bp.route('/activity', methods=['GET'])
@token_required
def get_activity(current_user):
    conn = get_db_connection()
    try:
        # Get user activity
        activities = conn.execute('''
            SELECT * FROM activity_log 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            LIMIT 50
        ''', (current_user['id'],)).fetchall()
        
        # Convert to list of dicts for JSON serialization
        activity_list = [dict(activity) for activity in activities]
        
        return jsonify({'activities': activity_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
