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
@responses_bp.route('/listing/<int:listing_id>', methods=['GET'])
@token_required
def get_listing_responses(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Check if user owns the listing
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found or unauthorized'}), 404
        
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
        
        # Convert to list of dicts for JSON serialization
        responses_list = [dict(response) for response in responses]
        
        return jsonify({
            'responses': responses_list,
            'count': len(responses_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user's responses
@responses_bp.route('/my-responses', methods=['GET'])
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
        count_query = 'SELECT COUNT(*) as count FROM responses WHERE user_id = ?'
        count_params = [current_user['id']]
        
        if status:
            count_query += ' AND status = ?'
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

# Create response to listing
@responses_bp.route('/listing/<int:listing_id>', methods=['POST'])
@token_required
def create_response(current_user, listing_id):
    # Check if user is executor
    if current_user['role'] != 'executor':
        return jsonify({'error': 'Only executors can respond to listings'}), 403
    
    conn = get_db_connection()
    try:
        # Check if listing exists and is published
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND status = 'published'
        ''', (listing_id,)).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found or not available'}), 404
        
        # Check if user already responded to this listing
        existing_response = conn.execute('''
            SELECT * FROM responses 
            WHERE listing_id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if existing_response:
            return jsonify({'error': 'You have already responded to this listing'}), 409
        
        # Get user's company if exists
        company = conn.execute('''
            SELECT c.id FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = ?
        ''', (current_user['id'],)).fetchone()
        
        company_id = company['id'] if company else None
        
        # Get executor profile
        executor = conn.execute('''
            SELECT * FROM executor_profiles 
            WHERE user_id = ?
        ''', (current_user['id'],)).fetchone()
        
        if not executor:
            return jsonify({'error': 'Executor profile not found'}), 404
        
        # Check if executor has enough points
        required_points = 1  # Default cost for response
        if executor['points'] < required_points:
            return jsonify({'error': 'Insufficient points to respond'}), 400
        
        data = request.get_json() or {}
        
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
        
        # Update executor points
        new_points = executor['points'] - required_points
        new_spent_points = executor['spent_points'] + required_points
        conn.execute('''
            UPDATE executor_profiles 
            SET points = ?, spent_points = ? 
            WHERE user_id = ?
        ''', (new_points, new_spent_points, current_user['id']))
        
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
        
        return jsonify({
            'message': 'Response created successfully',
            'response_id': response_id,
            'remaining_points': new_points
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update response status (accept/reject)
@responses_bp.route('/<int:response_id>/status', methods=['PUT'])
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
@responses_bp.route('/<int:response_id>', methods=['DELETE'])
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
