"""
Listings (job requests) routes for the Metal-Rezerv API.
Handles creation, management and retrieval of listings.
"""

import sqlite3
import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from src.utils.auth_middleware import token_required

listings_bp = Blueprint('listings', __name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Get all listings (with filters)
@listings_bp.route('', methods=['GET'])
@token_required
def get_listings(current_user):
    # Parse query parameters
    category = request.args.get('category')
    status = request.args.get('status', 'published')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = 'SELECT * FROM listings WHERE status = ?'
        params = [status]
        
        if category:
            query += ' AND category = ?'
            params.append(category)
        
        # Add pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        listings = conn.execute(query, params).fetchall()
        
        # Count total listings for pagination
        count_query = 'SELECT COUNT(*) as count FROM listings WHERE status = ?'
        count_params = [status]
        
        if category:
            count_query += ' AND category = ?'
            count_params.append(category)
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        listings_list = [dict(listing) for listing in listings]
        
        return jsonify({
            'listings': listings_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get listing by ID
@listings_bp.route('/<int:listing_id>', methods=['GET'])
@token_required
def get_listing(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Get listing
        listing = conn.execute('SELECT * FROM listings WHERE id = ?', (listing_id,)).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found'}), 404
        
        # Get listing owner
        owner = conn.execute('''
            SELECT id, email, role, phone, city, country 
            FROM users 
            WHERE id = ?
        ''', (listing['user_id'],)).fetchone()
        
        # Get responses count
        responses_count = conn.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM responses 
            WHERE listing_id = ?
        ''', (listing_id,)).fetchone()
        
        # Convert to dict for JSON serialization
        listing_dict = dict(listing)
        owner_dict = dict(owner) if owner else None
        responses_dict = dict(responses_count)
        
        return jsonify({
            'listing': listing_dict,
            'owner': owner_dict,
            'responses': responses_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Create new listing
@listings_bp.route('', methods=['POST'])
@token_required
def create_listing(current_user):
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'category', 'purchase_method', 'payment_terms', 
                      'listing_type', 'delivery_date', 'publication_period']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    try:
        # Get user's company if exists
        company = conn.execute('''
            SELECT c.id FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = ?
        ''', (current_user['id'],)).fetchone()
        
        company_id = company['id'] if company else None
        
        # Calculate purchase date based on delivery date if not provided
        purchase_date = data.get('purchase_date')
        if not purchase_date:
            # Default to 7 days before delivery
            delivery_date = datetime.strptime(data['delivery_date'], '%Y-%m-%d')
            purchase_date = (delivery_date - timedelta(days=7)).strftime('%Y-%m-%d')
        
        # Insert listing
        cursor = conn.execute('''
            INSERT INTO listings (
                title, description, category, purchase_method, payment_terms,
                listing_type, delivery_date, purchase_date, publication_period,
                status, user_id, company_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['title'],
            data.get('description', ''),
            data['category'],
            data['purchase_method'],
            data['payment_terms'],
            data['listing_type'],
            data['delivery_date'],
            purchase_date,
            data['publication_period'],
            'published',
            current_user['id'],
            company_id
        ))
        
        listing_id = cursor.lastrowid
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            company_id,
            'create_listing',
            f"Created listing: {data['title']}"
        ))
        
        conn.commit()
        
        return jsonify({
            'message': 'Listing created successfully',
            'listing_id': listing_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Update listing
@listings_bp.route('/<int:listing_id>', methods=['PUT'])
@token_required
def update_listing(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Check if user owns the listing
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found or unauthorized'}), 404
        
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['title', 'description', 'category', 'purchase_method', 
                         'payment_terms', 'listing_type', 'delivery_date', 
                         'purchase_date', 'publication_period', 'status']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Build SQL query dynamically
        fields = ', '.join([f"{field} = ?" for field in update_data.keys()])
        values = list(update_data.values())
        values.append(listing_id)
        
        conn.execute(f"UPDATE listings SET {fields} WHERE id = ?", values)
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            listing['company_id'],
            'update_listing',
            f"Updated listing: {listing['title']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Listing updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Delete listing
@listings_bp.route('/<int:listing_id>', methods=['DELETE'])
@token_required
def delete_listing(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Check if user owns the listing
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found or unauthorized'}), 404
        
        # Delete listing
        conn.execute('DELETE FROM listings WHERE id = ?', (listing_id,))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            listing['company_id'],
            'delete_listing',
            f"Deleted listing: {listing['title']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Listing deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user's listings
@listings_bp.route('/my-listings', methods=['GET'])
@token_required
def get_my_listings(current_user):
    # Parse query parameters
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    try:
        # Build query based on filters
        query = 'SELECT * FROM listings WHERE user_id = ?'
        params = [current_user['id']]
        
        if status:
            query += ' AND status = ?'
            params.append(status)
        
        # Add pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        # Execute query
        listings = conn.execute(query, params).fetchall()
        
        # Count total listings for pagination
        count_query = 'SELECT COUNT(*) as count FROM listings WHERE user_id = ?'
        count_params = [current_user['id']]
        
        if status:
            count_query += ' AND status = ?'
            count_params.append(status)
        
        total = conn.execute(count_query, count_params).fetchone()['count']
        
        # Convert to list of dicts for JSON serialization
        listings_list = [dict(listing) for listing in listings]
        
        return jsonify({
            'listings': listings_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Change listing status
@listings_bp.route('/<int:listing_id>/status', methods=['PUT'])
@token_required
def change_listing_status(current_user, listing_id):
    conn = get_db_connection()
    try:
        # Check if user owns the listing
        listing = conn.execute('''
            SELECT * FROM listings 
            WHERE id = ? AND user_id = ?
        ''', (listing_id, current_user['id'])).fetchone()
        
        if not listing:
            return jsonify({'error': 'Listing not found or unauthorized'}), 404
        
        data = request.get_json()
        
        # Validate status
        if 'status' not in data:
            return jsonify({'error': 'Missing status field'}), 400
        
        valid_statuses = ['published', 'unpublished', 'completed']
        if data['status'] not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Update status
        conn.execute('UPDATE listings SET status = ? WHERE id = ?', (data['status'], listing_id))
        
        # Log activity
        conn.execute('''
            INSERT INTO activity_log (user_id, company_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            current_user['id'],
            listing['company_id'],
            'change_listing_status',
            f"Changed listing status to {data['status']}: {listing['title']}"
        ))
        
        conn.commit()
        
        return jsonify({'message': 'Listing status updated successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
