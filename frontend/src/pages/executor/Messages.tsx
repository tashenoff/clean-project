import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface MessagePreview {
  user_id: number;
  user_email: string;
  listing_id: number;
  listing_title: string;
  last_text: string;
  last_time: string;
}

const ExecutorMessages: React.FC = () => {
  const [chats, setChats] = useState<MessagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/messages/my-chats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setChats(data.chats || []);
        setError(null);
      } catch (e) {
        setError('Ошибка загрузки чатов');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-4 mt-8">
      <h2 className="text-lg font-semibold mb-4">Личные сообщения</h2>
      {loading ? (
        <div>Загрузка...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : chats.length === 0 ? (
        <div className="text-gray-500">Нет чатов</div>
      ) : (
        <ul>
          {chats.map(chat => (
            <li key={chat.user_id + '-' + chat.listing_id} className="mb-3 border-b pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{chat.user_email}</div>
                  <div className="text-xs text-gray-500">Заказ: {chat.listing_title}</div>
                  <div className="text-xs text-gray-400 mt-1">{chat.last_text}</div>
                </div>
                <Link
                  to={`/executor/messages/${chat.user_id}/${chat.listing_id}`}
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs ml-2"
                >
                  Открыть чат
                </Link>
                <Link
                  to={`/executor/messages/${chat.user_id}/${chat.listing_id}`}
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs ml-2"
                >
                  Ответить
                </Link>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-right">{new Date(chat.last_time).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExecutorMessages; 