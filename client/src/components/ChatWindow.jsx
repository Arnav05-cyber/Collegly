import { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import { io } from 'socket.io-client';

export default function ChatWindow({ gigId, posterId, posterName, currentUserId, onClose, inline = false, canUploadFiles = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatEnded, setChatEnded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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

    newSocket.on('message_error', (data) => {
      console.error('Message error:', data.error);
      if (data.error.includes('ended') || data.error.includes('completed')) {
        setChatEnded(true);
      }
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
        // Check if any message has chatEnded flag
        const hasEndedChat = data.messages.some(msg => msg.chatEnded);
        setChatEnded(hasEndedChat);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || chatEnded) return;

    const messageData = {
      conversationId,
      senderId: currentUserId,
      receiverId: posterId,
      gigId,
      message: newMessage.trim()
    };

    try {
      socket.emit('send_message', messageData);
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        ...messageData,
        senderId: { _id: currentUserId },
        createdAt: new Date()
      }]);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.message?.includes('ended')) {
        setChatEnded(true);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || chatEnded) return;

    setUploading(true);

    try {
      const token = await window.Clerk?.session?.getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gigId', gigId);
      formData.append('receiverId', posterId);
      formData.append('message', `Sent a file: ${file.name}`);

      const response = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Add message to UI
        setMessages(prev => [...prev, data.message]);
        
        // Emit through socket for real-time update to receiver
        if (socket) {
          socket.emit('file_uploaded', data.message);
        }
      } else {
        alert(data.message || 'Failed to upload file');
        if (data.message?.includes('ended') || data.message?.includes('completed')) {
          setChatEnded(true);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
                  {msg.fileUrl ? (
                    <div className="message-file">
                      <div className="file-icon">
                        {msg.fileType?.startsWith('image/') ? '🖼️' : '📎'}
                      </div>
                      <div className="file-info">
                        <a 
                          href={`http://localhost:5000${msg.fileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-name"
                        >
                          {msg.fileName}
                        </a>
                        <span className="file-size">
                          {(msg.fileSize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      {msg.fileType?.startsWith('image/') && (
                        <img 
                          src={`http://localhost:5000${msg.fileUrl}`} 
                          alt={msg.fileName}
                          className="message-image"
                        />
                      )}
                    </div>
                  ) : (
                    <p>{msg.message}</p>
                  )}
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

        {chatEnded ? (
          <div className="chat-ended-notice">
            <p>🎉 This gig has been completed. The chat has ended.</p>
          </div>
        ) : (
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            {canUploadFiles && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                />
                <button
                  type="button"
                  className="chat-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload file"
                >
                  {uploading ? (
                    <span className="uploading-spinner">⏳</span>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </button>
              </>
            )}
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
        )}
      </div>
    </div>
  );
}
