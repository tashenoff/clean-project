"""
Main entry point for the Metal-Rezerv Flask application.
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add the project root directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import routes
from src.routes.auth import auth_bp
from src.routes.users import users_bp
from src.routes.companies import companies_bp
from src.routes.listings import listings_bp
from src.routes.responses import responses_bp
from src.routes.admin import admin_bp

# Create Flask app
app = Flask(__name__)
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'metal_rezerv.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(companies_bp, url_prefix='/api/companies')
app.register_blueprint(listings_bp, url_prefix='/api/listings')
app.register_blueprint(responses_bp, url_prefix='/api')  # Changed to /api to support both /api/listings/<id>/responses and /api/responses/...
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    # Initialize database
    from src.models.database_schema import init_db, DB_PATH
    init_db(DB_PATH)
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
