"""
Database schema for Metal-Rezerv project.
This file defines all models for the SQLite database.
"""

from datetime import datetime
import sqlite3
import os

# Database initialization
def init_db(db_path):
    """Initialize the database with all required tables"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,  -- 'customer', 'executor', 'admin'
        phone TEXT,
        city TEXT,
        country TEXT,
        balance INTEGER DEFAULT 0,  -- баланс пользователя
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Companies table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bin TEXT,
        address TEXT,
        status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
        balance INTEGER DEFAULT 0,
        max_balance INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Company_Users table (for many-to-many relationship)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS company_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,  -- 'owner', 'admin', 'manager', 'employee'
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(company_id, user_id)
    )
    ''')
    
    # Create Executor_Profiles table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS executor_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        experience_level TEXT DEFAULT 'BEGINNER',  -- 'BEGINNER', 'EXPERIENCED', 'EXPERT'
        points INTEGER DEFAULT 0,
        spent_points INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')
    
    # Create Listings (Requests/Jobs) table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        purchase_method TEXT,
        payment_terms TEXT,
        listing_type TEXT,
        delivery_date DATE,
        purchase_date DATE,
        publication_period INTEGER,  -- in days
        status TEXT DEFAULT 'published',  -- 'published', 'unpublished', 'completed'
        user_id INTEGER NOT NULL,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
    )
    ''')
    
    # Create Responses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        company_id INTEGER,
        status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
    )
    ''')
    
    # Create Balance_Transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS balance_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        user_id INTEGER,  -- NULL if company balance, user_id if user balance
        amount INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,  -- 'deposit', 'withdrawal', 'transfer'
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
    ''')
    
    # Create Activity_Log table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company_id INTEGER,
        action_type TEXT NOT NULL,  -- 'login', 'create_listing', 'respond', etc.
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
    )
    ''')
    
    # Create Reviews table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        executor_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (executor_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')
    
    # Create Messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        listing_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

# Helper function to create database directory if it doesn't exist
def ensure_db_directory(db_path):
    db_dir = os.path.dirname(db_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)

# Initialize database when this module is imported
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')
ensure_db_directory(DB_PATH)
init_db(DB_PATH)
