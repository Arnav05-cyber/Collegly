import { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import { io } from 'socket.io-client';

export default function ChatWindow({ gigId, posterId, posterName, currentUserId, onClose, inline = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const conversationId = [currentUserId, posterId, gigId].sort().join('_');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join with user ID
    newSocket.emit('join', currentUserId);

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('message_sent', (message) => {
      // Message confirmation from server
      console.log('Message sent:', message);
    });

    // Fetch existing messages
    fetchMessages();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = await window.Clerk?.session?.getToken();
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      conversationId,
      senderId: currentUserId,
      receiverId: posterId,
      gigId,
      message: newMessage.trim()
    };

    socket.emit('send_message', messageData);
    
    // Optimistically add message to UI
    setMessages(prev => [...prev, {
      ...messageData,
      senderId: { _id: currentUserId },
      createdAt: new Date()
    }]);
    
    setNewMessage('');
  };

  return (
    <div className={`chat-window-overlay ${inline ? 'inline' : ''}`} onClick={inline ? null : onClose}>
      <div className="chat-window" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>Chat with {posterName}</h3>
            <span className="chat-status">● Online</span>
          </div>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.senderId._id === currentUserId ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  <p>{msg.message}</p>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
