"""
Admin routes for the Metal-Rezerv API.
Handles administrative functions like approving companies, managing users, and system settings.
"""

import sqlite3
import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from src.utils.auth_middleware import admin_required

admin_bp = Blueprint('admin', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Get all companies
@admin_bp.route('/companies', methods=['GET'])
@admin_required
def get_companies(current_user):
    # Parse query parameters
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = 'SELECT * FROM companies'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        # Add pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        companies = conn.execute(query, params).fetchall()
        
        # Count total companies for pagination
        count_query = 'SELECT COUNT(*) as count FROM companies'
        count_params = []
        
        if status:
            count_query += ' WHERE status = ?'
            count_params.append(status)
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        companies_list = [dict(company) for company in companies]
        
        return jsonify({
            'companies': companies_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update company status
@admin_bp.route('/companies/<int:company_id>/status', methods=['PUT'])
@admin_required
def update_company_status(current_user, company_id):
    data = request.get_json()
    
    # Validate status
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    valid_statuses = ['pending', 'approved', 'rejected']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    conn = get_db_connection()
    try:
        # Check if company exists
        company = conn.execute('SELECT * FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Update company status
        conn.execute('UPDATE companies SET status = ? WHERE id = ?', (data['status'], company_id))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, action_type, description)
            VALUES (?, ?, ?)
        ''', (
            current_user['id'],
            'update_company_status',
            f"Updated company status to {data['status']}: {company['name']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Company status updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get all users
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    # Parse query parameters
    role = request.args.get('role')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = 'SELECT id, email, role, phone, city, country, created_at FROM users'
        params = []
        
        if role:
            query += ' WHERE role = ?'
            params.append(role)
        
        # Add pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        users = conn.execute(query, params).fetchall()
        
        # Count total users for pagination
        count_query = 'SELECT COUNT(*) as count FROM users'
        count_params = []
        
        if role:
            count_query += ' WHERE role = ?'
            count_params.append(role)
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        users_list = [dict(user) for user in users]
        
        return jsonify({
            'users': users_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Create admin user
@admin_bp.route('/users/admin', methods=['POST'])
@admin_required
def create_admin(current_user):
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    try:
        # Check if user already exists
        existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
        
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
        # Insert admin user
        cursor = conn.execute('''
            INSERT INTO users (email, password, role, phone, city, country) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['email'],
            hashed_password,
            'admin',
            data.get('phone', ''),
            data.get('city', ''),
            data.get('country', '')
        ))
        
        user_id = cursor.lastrowid
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, action_type, description)
            VALUES (?, ?, ?)
        ''', (
            current_user['id'],
            'create_admin',
            f"Created admin user: {data['email']}"
        ))
        
        conn.commit()
        
        return jsonify({
            'message': 'Admin user created successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get system statistics
@admin_bp.route('/statistics', methods=['GET'])
@admin_required
def get_statistics(current_user):
    conn = get_db_connection()
    try:
        # Get user counts
        user_counts = conn.execute('''
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                SUM(CASE WHEN role = 'executor' THEN 1 ELSE 0 END) as executors,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
            FROM users
        ''').fetchone()
        
        # Get company counts
        company_counts = conn.execute('''
            SELECT 
                COUNT(*) as total_companies,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM companies
        ''').fetchone()
        
        # Get listing counts
        listing_counts = conn.execute('''
            SELECT 
                COUNT(*) as total_listings,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'unpublished' THEN 1 ELSE 0 END) as unpublished,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM listings
        ''').fetchone()
        
        # Get response counts
        response_counts = conn.execute('''
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM responses
        ''').fetchone()
        
        # Convert to dict for JSON serialization
        statistics = {
            'users': dict(user_counts),
            'companies': dict(company_counts),
            'listings': dict(listing_counts),
            'responses': dict(response_counts)
        }
        
        return jsonify(statistics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get activity log
@admin_bp.route('/activity-log', methods=['GET'])
@admin_required
def get_activity_log(current_user):
    # Parse query parameters
    user_id = request.args.get('user_id')
    action_type = request.args.get('action_type')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = '''
            SELECT al.*, u.email as user_email
            FROM activity_log al
            JOIN users u ON al.user_id = u.id
        '''
        params = []
        
        where_clauses = []
        if user_id:
            where_clauses.append('al.user_id = ?')
            params.append(user_id)
        
        if action_type:
            where_clauses.append('al.action_type = ?')
            params.append(action_type)
        
        if where_clauses:
            query += ' WHERE ' + ' AND '.join(where_clauses)
        
        # Add pagination
        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        logs = conn.execute(query, params).fetchall()
        
        # Count total logs for pagination
        count_query = 'SELECT COUNT(*) as count FROM activity_log al'
        count_params = []
        
        if where_clauses:
            count_query += ' WHERE ' + ' AND '.join(where_clauses)
            count_params = params[:-2]  # Remove pagination params
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        logs_list = [dict(log) for log in logs]
        
        return jsonify({
            'logs': logs_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update company max balance
@admin_bp.route('/companies/<int:company_id>/max-balance', methods=['PUT'])
@admin_required
def update_max_balance(current_user, company_id):
    data = request.get_json()
    
    # Validate max_balance
    if 'max_balance' not in data or not isinstance(data['max_balance'], int) or data['max_balance'] <= 0:
        return jsonify({'error': 'Invalid max_balance value'}), 400
    
    conn = get_db_connection()
    try:
        # Check if company exists
        company = conn.execute('SELECT * FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Update max balance
        conn.execute('UPDATE companies SET max_balance = ? WHERE id = ?', (data['max_balance'], company_id))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, action_type, description)
            VALUES (?, ?, ?)
        ''', (
            current_user['id'],
            'update_max_balance',
            f"Updated max balance for company {company['name']} to {data['max_balance']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Company max balance updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
