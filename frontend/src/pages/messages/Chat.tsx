import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { userAPI } from '../../api/api';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  created_at: string;
}

const Chat: React.FC = () => {
  const { userId, listingId } = useParams<{ userId: string; listingId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages?user_id=${userId}&listing_id=${listingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setMessages(data.messages || []);
        setError(null);
      } catch (e) {
        setError('Ошибка загрузки сообщений');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userId, listingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiver_id: Number(userId),
          listing_id: Number(listingId),
          text: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        // Обновить сообщения
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      setError('Ошибка отправки сообщения');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-4 mt-8">
      <h2 className="text-lg font-semibold mb-4">Личные сообщения</h2>
      <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
        {loading ? (
          <div>Загрузка...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500">Нет сообщений</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`mb-2 flex ${msg.sender_id === Number(userId) ? 'justify-start' : 'justify-end'}`}>
              <div className={`px-3 py-2 rounded-lg ${msg.sender_id === Number(userId) ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'}`}>
                <div className="text-xs text-gray-500 mb-1">{new Date(msg.created_at).toLocaleString()}</div>
                <div>{msg.text}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">Отправить</button>
      </form>
    </div>
  );
};

export default Chat; 