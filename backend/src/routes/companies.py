"""
Company management routes for the Metal-Rezerv API.
Handles company operations, employee management, and balance operations.
"""

import sqlite3
import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from src.utils.auth_middleware import token_required

companies_bp = Blueprint('companies', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Get company details
@companies_bp.route('/<int:company_id>', methods=['GET'])
@token_required
def get_company(current_user, company_id):
    conn = get_db_connection()
    try:
        # Check if user belongs to company
        company_user = conn.execute('''
            SELECT * FROM company_users 
            WHERE company_id = ? AND user_id = ?
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized access to company data'}), 403
        
        # Get company data
        company = conn.execute('SELECT * FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Get company employees
        employees = conn.execute('''
            SELECT u.id, u.email, u.role as user_role, u.phone, u.city, u.country, cu.role as company_role
            FROM users u
            JOIN company_users cu ON u.id = cu.user_id
            WHERE cu.company_id = ?
        ''', (company_id,)).fetchall()
        
        # Convert to dict for JSON serialization
        company_dict = dict(company)
        employees_list = [dict(employee) for employee in employees]
        
        return jsonify({
            'company': company_dict,
            'employees': employees_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update company details
@companies_bp.route('/<int:company_id>', methods=['PUT'])
@token_required
def update_company(current_user, company_id):
    conn = get_db_connection()
    try:
        # Check if user is company owner or admin
        company_user = conn.execute('''
            SELECT * FROM company_users 
            WHERE company_id = ? AND user_id = ? AND role IN ('owner', 'admin')
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized to update company data'}), 403
        
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['name', 'bin', 'address']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Build SQL query dynamically
        fields = ', '.join([f"{field} = ?" for field in update_data.keys()])
        values = list(update_data.values())
        values.append(company_id)
        
        conn.execute(f"UPDATE companies SET {fields} WHERE id = ?", values)
        conn.commit()
        
        return jsonify({'message': 'Company updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Add employee to company
@companies_bp.route('/<int:company_id>/employees', methods=['POST'])
@token_required
def add_employee(current_user, company_id):
    conn = get_db_connection()
    try:
        # Check if user is company owner or admin
        company_user = conn.execute('''
            SELECT cu.*, u.role as user_role 
            FROM company_users cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.company_id = ? AND cu.user_id = ? 
            AND (cu.role IN ('owner', 'admin') OR u.role = 'executor')
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized to add employees'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'role', 'company_role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate roles
        valid_user_roles = ['customer', 'executor']
        valid_company_roles = ['admin', 'manager', 'employee']
        
        if data['role'] not in valid_user_roles:
            return jsonify({'error': 'Invalid user role'}), 400
        
        if data['company_role'] not in valid_company_roles:
            return jsonify({'error': 'Invalid company role'}), 400
        
        # Check if user already exists
        existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
        
        if existing_user:
            # Check if user is already in this company
            existing_company_user = conn.execute('''
                SELECT * FROM company_users 
                WHERE company_id = ? AND user_id = ?
            ''', (company_id, existing_user['id'])).fetchone()
            
            if existing_company_user:
                return jsonify({'error': 'User is already a member of this company'}), 409
            
            # Add existing user to company
            conn.execute('''
                INSERT INTO company_users (company_id, user_id, role) 
                VALUES (?, ?, ?)
            ''', (company_id, existing_user['id'], data['company_role']))
            
            user_id = existing_user['id']
        else:
            # Create new user
            hashed_password = generate_password_hash(data['password'])
            
            cursor = conn.execute('''
                INSERT INTO users (email, password, role, phone, city, country) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                data['email'], 
                hashed_password, 
                data['role'], 
                data.get('phone', ''), 
                data.get('city', ''), 
                data.get('country', '')
            ))
            
            user_id = cursor.lastrowid
            
            # If user is executor, create executor profile
            if data['role'] == 'executor':
                conn.execute('''
                    INSERT INTO executor_profiles (user_id, experience_level, points) 
                    VALUES (?, ?, ?)
                ''', (user_id, 'BEGINNER', 0))
            
            # Add new user to company
            conn.execute('''
                INSERT INTO company_users (company_id, user_id, role) 
                VALUES (?, ?, ?)
            ''', (company_id, user_id, data['company_role']))
        
        conn.commit()
        
        return jsonify({
            'message': 'Employee added successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Remove employee from company
@companies_bp.route('/<int:company_id>/employees/<int:user_id>', methods=['DELETE'])
@token_required
def remove_employee(current_user, company_id, user_id):
    conn = get_db_connection()
    try:
        # Check if user is company owner or admin
        company_user = conn.execute('''
            SELECT * FROM company_users 
            WHERE company_id = ? AND user_id = ? AND role IN ('owner', 'admin')
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized to remove employees'}), 403
        
        # Check if target user is company owner
        target_user = conn.execute('''
            SELECT * FROM company_users 
            WHERE company_id = ? AND user_id = ?
        ''', (company_id, user_id)).fetchone()
        
        if not target_user:
            return jsonify({'error': 'User is not a member of this company'}), 404
        
        if target_user['role'] == 'owner':
            return jsonify({'error': 'Cannot remove company owner'}), 403
        
        # Remove user from company
        conn.execute('''
            DELETE FROM company_users 
            WHERE company_id = ? AND user_id = ?
        ''', (company_id, user_id))
        
        conn.commit()
        
        return jsonify({'message': 'Employee removed successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get company balance
@companies_bp.route('/<int:company_id>/balance', methods=['GET'])
@token_required
def get_balance(current_user, company_id):
    conn = get_db_connection()
    try:
        # Check if user belongs to company
        company_user = conn.execute('''
            SELECT * FROM company_users 
            WHERE company_id = ? AND user_id = ?
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized access to company balance'}), 403
        
        # Get company balance
        company = conn.execute('SELECT balance, max_balance FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Get balance transactions
        transactions = conn.execute('''
            SELECT * FROM balance_transactions 
            WHERE company_id = ? 
            ORDER BY created_at DESC
            LIMIT 50
        ''', (company_id,)).fetchall()
        
        # Convert to dict for JSON serialization
        transactions_list = [dict(transaction) for transaction in transactions]
        
        return jsonify({
            'balance': company['balance'],
            'max_balance': company['max_balance'],
            'transactions': transactions_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Add balance to company
@companies_bp.route('/<int:company_id>/balance', methods=['POST'])
@token_required
def add_balance(current_user, company_id):
    conn = get_db_connection()
    try:
        # Check if user is company owner or admin
        company_user = conn.execute('''
            SELECT cu.*, u.role as user_role 
            FROM company_users cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.company_id = ? AND cu.user_id = ? 
            AND (cu.role IN ('owner', 'admin') OR u.role = 'executor')
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized to add balance'}), 403
        
        data = request.get_json()
        
        # Validate amount
        if 'amount' not in data or not isinstance(data['amount'], int) or data['amount'] <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        # Get current balance
        company = conn.execute('SELECT balance, max_balance FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if adding balance would exceed max_balance
        new_balance = company['balance'] + data['amount']
        if new_balance > company['max_balance']:
            return jsonify({'error': f'Balance cannot exceed maximum of {company["max_balance"]}'}), 400
        
        # Update company balance
        conn.execute('UPDATE companies SET balance = ? WHERE id = ?', (new_balance, company_id))
        
        # Record transaction
        conn.execute('''
            INSERT INTO balance_transactions (company_id, user_id, amount, transaction_type, description) 
            VALUES (?, ?, ?, ?, ?)
        ''', (
            company_id, 
            current_user['id'], 
            data['amount'], 
            'deposit', 
            data.get('description', 'Company balance deposit')
        ))
        
        conn.commit()
        
        return jsonify({
            'message': 'Balance added successfully',
            'new_balance': new_balance
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Add balance to employee
@companies_bp.route('/<int:company_id>/employees/<int:user_id>/balance', methods=['POST'])
@token_required
def add_employee_balance(current_user, company_id, user_id):
    conn = get_db_connection()
    try:
        # Check if user is company owner or admin
        company_user = conn.execute('''
            SELECT cu.*, u.role as user_role 
            FROM company_users cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.company_id = ? AND cu.user_id = ? 
            AND (cu.role IN ('owner', 'admin') OR u.role = 'executor')
        ''', (company_id, current_user['id'])).fetchone()
        
        if not company_user:
            return jsonify({'error': 'Unauthorized to add employee balance'}), 403
        
        # Check if target user belongs to company
        target_user = conn.execute('''
            SELECT u.*, cu.role as company_role
            FROM users u
            JOIN company_users cu ON u.id = cu.user_id
            WHERE cu.company_id = ? AND u.id = ?
        ''', (company_id, user_id)).fetchone()
        
        if not target_user:
            return jsonify({'error': 'User is not a member of this company'}), 404
        
        data = request.get_json()
        
        # Validate amount
        if 'amount' not in data or not isinstance(data['amount'], int) or data['amount'] <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        # Get company balance
        company = conn.execute('SELECT balance FROM companies WHERE id = ?', (company_id,)).fetchone()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if company has enough balance
        if company['balance'] < data['amount']:
            return jsonify({'error': 'Insufficient company balance'}), 400
        
        # Begin transaction
        conn.execute('BEGIN TRANSACTION')
        
        try:
            # Update company balance
            new_company_balance = company['balance'] - data['amount']
            conn.execute('UPDATE companies SET balance = ? WHERE id = ?', 
                       (new_company_balance, company_id))
            
            # Update user balance
            new_user_balance = target_user['balance'] + data['amount']
            conn.execute('UPDATE users SET balance = ? WHERE id = ?', 
                       (new_user_balance, user_id))
            
            # Record transaction
            conn.execute('''
                INSERT INTO balance_transactions (company_id, user_id, amount, transaction_type, description) 
                VALUES (?, ?, ?, ?, ?)
            ''', (
                company_id, 
                user_id, 
                data['amount'], 
                'transfer', 
                data.get('description', 'Balance transfer to employee')
            ))
            
            conn.commit()
            
            return jsonify({
                'message': 'Balance added to employee successfully',
                'new_company_balance': new_company_balance,
                'new_user_balance': new_user_balance
            }), 200
            
        except Exception as e:
            conn.rollback()
            raise e
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
