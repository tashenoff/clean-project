import os
import sqlite3
from flask import Blueprint, request, jsonify
from src.utils.auth_middleware import token_required

messages_bp = Blueprint('messages', __name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'metal_rezerv.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Получить переписку между двумя пользователями по объявлению
@messages_bp.route('/messages', methods=['GET'])
@token_required
def get_messages(current_user):
    user_id = request.args.get('user_id', type=int)
    listing_id = request.args.get('listing_id', type=int)
    if not user_id or not listing_id:
        return jsonify({'error': 'Missing user_id or listing_id'}), 400
    conn = get_db_connection()
    try:
        messages = conn.execute('''
            SELECT * FROM messages
            WHERE listing_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            ORDER BY created_at ASC
        ''', (listing_id, current_user['id'], user_id, user_id, current_user['id'])).fetchall()
        messages_list = [dict(msg) for msg in messages]
        return jsonify({'messages': messages_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Отправить сообщение
@messages_bp.route('/messages', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    listing_id = data.get('listing_id')
    text = data.get('text')
    if not receiver_id or not listing_id or not text:
        return jsonify({'error': 'Missing receiver_id, listing_id or text'}), 400
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO messages (sender_id, receiver_id, listing_id, text)
            VALUES (?, ?, ?, ?)
        ''', (current_user['id'], receiver_id, listing_id, text))
        conn.commit()
        # Вернуть обновлённую переписку
        messages = conn.execute('''
            SELECT * FROM messages
            WHERE listing_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            ORDER BY created_at ASC
        ''', (listing_id, current_user['id'], receiver_id, receiver_id, current_user['id'])).fetchall()
        messages_list = [dict(msg) for msg in messages]
        return jsonify({'messages': messages_list}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Получить список чатов пользователя (уникальные собеседники по каждому объявлению)
@messages_bp.route('/messages/my-chats', methods=['GET'])
@token_required
def get_my_chats(current_user):
    conn = get_db_connection()
    try:
        # Получаем последние сообщения по каждому (собеседник, listing_id)
        query = '''
        SELECT
          sub.user_id,
          u.email as user_email,
          sub.listing_id,
          l.title as listing_title,
          sub.text as last_text,
          sub.created_at as last_time
        FROM (
          SELECT
            CASE
              WHEN sender_id = ? THEN receiver_id
              ELSE sender_id
            END as user_id,
            listing_id,
            text,
            created_at
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
        ) sub
        JOIN users u ON u.id = sub.user_id
        JOIN listings l ON l.id = sub.listing_id
        INNER JOIN (
          SELECT
            CASE
              WHEN sender_id = ? THEN receiver_id
              ELSE sender_id
            END as user_id,
            listing_id,
            MAX(created_at) as max_time
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY user_id, listing_id
        ) last_msg
        ON last_msg.user_id = sub.user_id AND last_msg.listing_id = sub.listing_id AND last_msg.max_time = sub.created_at
        ORDER BY sub.created_at DESC
        '''
        params = [current_user['id'], current_user['id'], current_user['id'], current_user['id'], current_user['id'], current_user['id']]
        chats = conn.execute(query, params).fetchall()
        chats_list = [dict(chat) for chat in chats]
        return jsonify({'chats': chats_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close() 