"""
Responses (job applications) routes for the Metal-Rezerv API.
Handles creation, management and retrieval of responses to listings.
"""

import sqlite3
import os
from flask import Blueprint, request, jsonify
from src.utils.auth_middleware import token_required

responses_bp = Blueprint('responses', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Get responses for a listing
@responses_bp.route('/listings/<int:listing_id>/responses', methods=['GET'])
@token_required
def get_listing_responses(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Check if user has access to the listing (same company)
        listing = conn.execute('''
            SELECT l.* FROM listings l
            JOIN company_users cu ON l.company_id = cu.company_id
            WHERE l.id = ? AND cu.user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if not listing:
            print(f"User {current_user['id']} does not have access to listing {listing_id}")
            return jsonify({'error': 'Listing not found or unauthorized'}), 404
        
        print(f"Found listing {listing_id} for user {current_user['id']}")
        
        # Get responses
        responses = conn.execute('''
            SELECT r.*, u.email, u.phone, u.city, u.country,
                   ep.experience_level, ep.points, ep.spent_points
            FROM responses r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN executor_profiles ep ON u.id = ep.user_id
            WHERE r.listing_id = ?
            ORDER BY r.created_at DESC
        ''', (listing_id,)).fetchall()
        
        print(f"Found {len(responses)} responses for listing {listing_id}")
        
        # Convert to list of dicts for JSON serialization
        responses_list = [dict(response) for response in responses]
        
        return jsonify({
            'responses': responses_list,
            'count': len(responses_list)
        }), 200
        
    except Exception as e:
        print(f"Error getting responses for listing {listing_id}:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user's responses
@responses_bp.route('/responses/my-responses', methods=['GET'])
@token_required
def get_my_responses(current_user):
    # Parse query parameters
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = '''
            SELECT r.*, l.title as listing_title, l.category, l.status as listing_status
            FROM responses r
            JOIN listings l ON r.listing_id = l.id
            WHERE r.user_id = ?
            AND (
                -- Показываем все отклики для активных заявок
                (l.status != 'completed' AND r.status IN ('pending', 'rejected'))
                OR 
                -- Для завершенных заявок показываем только принятые отклики
                (l.status = 'completed' AND r.status = 'accepted')
            )
        '''
        params = [current_user['id']]
        
        if status:
            query += ' AND r.status = ?'
            params.append(status)
        
        # Add pagination
        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        responses = conn.execute(query, params).fetchall()
        
        # Count total responses for pagination
        count_query = '''
            SELECT COUNT(*) as count 
            FROM responses r
            JOIN listings l ON r.listing_id = l.id
            WHERE r.user_id = ?
            AND (
                (l.status != 'completed' AND r.status IN ('pending', 'rejected'))
                OR 
                (l.status = 'completed' AND r.status = 'accepted')
            )
        '''
        count_params = [current_user['id']]
        
        if status:
            count_query += ' AND r.status = ?'
            count_params.append(status)
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        responses_list = [dict(response) for response in responses]
        
        return jsonify({
            'responses': responses_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get statistics for user's responses
@responses_bp.route('/responses/my-responses/statistics', methods=['GET'])
@token_required
def get_my_responses_statistics(current_user):
    conn = get_db_connection()
    try:
        stats = conn.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM responses
            WHERE user_id = ?
        ''', (current_user['id'],)).fetchone()
        return jsonify({
            'total': stats['total'],
            'pending': stats['pending'],
            'accepted': stats['accepted'],
            'rejected': stats['rejected']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Create response to listing
@responses_bp.route('/listings/<int:listing_id>/responses', methods=['POST'])
@token_required
def create_response(current_user, listing_id):
    print(f"Creating response for listing {listing_id} by user {current_user['id']}")
    
    # Check if user is executor
    if current_user['role'] != 'executor':
        print(f"User {current_user['id']} is not an executor")
        return jsonify({'error': 'Only executors can respond to listings'}), 403
    
    conn = get_db_connection()
    try:
        # Check if listing exists and is published
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND status = 'published'
        ''', (listing_id,)).fetchone()
        
        if not listing:
            print(f"Listing {listing_id} not found or not published")
            return jsonify({'error': 'Listing not found or not available'}), 404
        
        # Check if user already responded to this listing
        existing_response = conn.execute('''
            SELECT * FROM responses 
            WHERE listing_id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if existing_response:
            print(f"User {current_user['id']} already responded to listing {listing_id}")
            return jsonify({'error': 'You have already responded to this listing'}), 409
        
        # Get user's company if exists
        company = conn.execute('''
            SELECT c.id FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = ?
        ''', (current_user['id'],)).fetchone()
        
        company_id = company['id'] if company else None
        print(f"Company ID for user {current_user['id']}: {company_id}")
        
        # Get user balance
        user = conn.execute('''
            SELECT balance FROM users 
            WHERE id = ?
        ''', (current_user['id'],)).fetchone()
        
        if not user:
            print(f"User {current_user['id']} not found")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"Current user balance: {user['balance']}")
        
        # Check if user has enough balance
        required_balance = 1  # Default cost for response
        if user['balance'] < required_balance:
            print(f"Insufficient balance: required {required_balance}, current {user['balance']}")
            return jsonify({
                'error': 'Insufficient balance to respond',
                'required': required_balance,
                'current': user['balance']
            }), 400
        
        data = request.get_json() or {}
        print(f"Request data: {data}")
        
        # Insert response
        cursor = conn.execute('''
            INSERT INTO responses (listing_id, user_id, company_id, message)
            VALUES (?, ?, ?, ?)
        ''', (
            listing_id,
            current_user['id'],
            company_id,
            data.get('message', '')
        ))
        
        response_id = cursor.lastrowid
        print(f"Created response with ID: {response_id}")
        
        # Update user balance
        new_balance = user['balance'] - required_balance
        conn.execute('''
            UPDATE users 
            SET balance = ?
            WHERE id = ?
        ''', (new_balance, current_user['id']))
        
        print(f"Updated user balance to: {new_balance}")
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            company_id,
            'create_response',
            f"Responded to listing: {listing['title']}"
        ))
        
        conn.commit()
        print("Transaction committed successfully")
        
        return jsonify({
            'message': 'Response created successfully',
            'response_id': response_id,
            'remaining_balance': new_balance
        }), 201
        
    except Exception as e:
        print(f"Error creating response: {str(e)}")
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update response status (accept/reject)
@responses_bp.route('/responses/<int:response_id>/status', methods=['PUT'])
@token_required
def update_response_status(current_user, response_id):
    data = request.get_json()
    
    # Validate status
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    valid_statuses = ['accepted', 'rejected']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status. Must be "accepted" or "rejected"'}), 400
    
    conn = get_db_connection()
    try:
        # Get response
        response = conn.execute('SELECT * FROM responses WHERE id = ?', (response_id,)).fetchone()
        
        if not response:
            return jsonify({'error': 'Response not found'}), 404
        
        # Get listing
        listing = conn.execute('SELECT * FROM listings WHERE id = ?', (response['listing_id'],)).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found'}), 404
        
        # Check if user owns the listing
        if listing['user_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized to update this response'}), 403
        
        # Update response status
        conn.execute('UPDATE responses SET status = ? WHERE id = ?', (data['status'], response_id))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            listing['company_id'],
            'update_response_status',
            f"Updated response status to {data['status']} for listing: {listing['title']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': f'Response {data["status"]} successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Delete response
@responses_bp.route('/responses/<int:response_id>', methods=['DELETE'])
@token_required
def delete_response(current_user, response_id):
    conn = get_db_connection()
    try:
        # Check if user owns the response
        response = conn.execute('''
            SELECT * FROM responses 
            WHERE id = ? AND user_id = ?
        ''', (response_id, current_user['id'])).fetchone()
        
        if not response:
            return jsonify({'error': 'Response not found or unauthorized'}), 404
        
        # Check if response can be deleted (only pending responses)
        if response['status'] != 'pending':
            return jsonify({'error': 'Cannot delete response that has been accepted or rejected'}), 400
        
        # Get listing
        listing = conn.execute('SELECT * FROM listings WHERE id = ?', (response['listing_id'],)).fetchone()
        
        # Delete response
        conn.execute('DELETE FROM responses WHERE id = ?', (response_id,))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            response['company_id'],
            'delete_response',
            f"Deleted response for listing: {listing['title'] if listing else 'Unknown'}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Response deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Получить отзывы о пользователе (исполнителе)
@responses_bp.route('/users/<int:user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    conn = get_db_connection()
    try:
        reviews = conn.execute('''
            SELECT r.*, u.email as customer_email, l.title as listing_title
            FROM reviews r
            JOIN users u ON r.customer_id = u.id
            JOIN listings l ON r.listing_id = l.id
            WHERE r.executor_id = ?
            ORDER BY r.created_at DESC
        ''', (user_id,)).fetchall()
        reviews_list = [dict(row) for row in reviews]
        avg_rating = None
        count = len(reviews_list)
        if count > 0:
            avg_rating = sum([r['rating'] for r in reviews_list]) / count
        return jsonify({
            'reviews': reviews_list,
            'average_rating': avg_rating,
            'count': count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
