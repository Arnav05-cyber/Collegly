import './MessagesPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import ChatWindow from '../components/ChatWindow';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { io } from 'socket.io-client';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCurrentUser();
      fetchConversations();

      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (socket && currentUserId) {
      // Join with user ID
      socket.emit('join', currentUserId);

      // Listen for incoming messages
      socket.on('receive_message', () => {
        // Refresh conversations when new message arrives
        fetchConversations();
      });
    }
  }, [socket, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        console.log('Clerk not ready or user not signed in');
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error('No token for fetching current user');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Current user data:', data);
      if (data.success) {
        setCurrentUserId(data.user._id);
        console.log('Current user ID set:', data.user._id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        console.log('Clerk not ready or user not signed in');
        setLoading(false);
        return;
      }

      const token = await getToken();
      console.log('Fetching conversations with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Conversations data:', data);
      console.log('Conversations array:', data.conversations);
      console.log('Is array?:', Array.isArray(data.conversations));
      
      if (data.success && data.conversations) {
        console.log('Setting conversations, length:', data.conversations.length);
        setConversations(data.conversations);
        console.log('Conversations state updated');
      } else {
        console.error('Failed to fetch conversations:', data.message || 'No conversations in response');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const handleOpenChat = (conversation) => {
    console.log('Opening chat for conversation:', conversation);
    const lastMessage = conversation.lastMessage;
    
    if (!lastMessage || !lastMessage.senderId || !lastMessage.receiverId) {
      console.error('Invalid conversation data:', conversation);
      return;
    }

    const otherUser = lastMessage.senderId._id === currentUserId 
      ? lastMessage.receiverId 
      : lastMessage.senderId;

    console.log('Other user:', otherUser);

    setSelectedChat({
      gigId: lastMessage.gigId._id,
      posterId: otherUser._id,
      posterName: `${otherUser.firstName} ${otherUser.lastName}`,
      gigTitle: lastMessage.gigId.title,
      conversationId: conversation._id
    });

    // Mark conversation as read locally
    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversation._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="messages-container">
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={30}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="messages-content">
        {/* Left Sidebar - Conversations List */}
        <div className="messages-sidebar">
          <div className="messages-header">
            <h1 className="messages-title">Messages</h1>
            <p className="messages-subtitle">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>No messages yet</p>
              <button 
                className="browse-button"
                onClick={() => navigate('/tasku/browse')}
              >
                Browse Gigs
              </button>
            </div>
          ) : (
          <div className="conversations-list">
            {conversations.map((conversation) => {
              const lastMessage = conversation.lastMessage;
              
              // Skip if data is incomplete
              if (!lastMessage || !lastMessage.senderId || !lastMessage.receiverId || !lastMessage.gigId) {
                console.warn('Incomplete conversation data:', {
                  hasLastMessage: !!lastMessage,
                  hasSenderId: !!lastMessage?.senderId,
                  hasReceiverId: !!lastMessage?.receiverId,
                  hasGigId: !!lastMessage?.gigId,
                  fullData: conversation
                });
                return null;
              }

              const otherUser = lastMessage.senderId._id === currentUserId 
                ? lastMessage.receiverId 
                : lastMessage.senderId;
              const isUnread = conversation.unreadCount > 0;
              const isActive = selectedChat?.conversationId === conversation._id;

              return (
                <div 
                  key={conversation._id}
                  className={`conversation-card ${isUnread ? 'unread' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => handleOpenChat(conversation)}
                >
                  <div className="conversation-avatar">
                    {otherUser.profileImage ? (
                      <img src={otherUser.profileImage} alt={otherUser.firstName || 'User'} />
                    ) : (
                      <div className="avatar-placeholder">
                        {(otherUser.firstName?.[0] || '?')}{(otherUser.lastName?.[0] || '')}
                      </div>
                    )}
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-top">
                      <h3 className="conversation-name">
                        {otherUser.firstName || 'Unknown'} {otherUser.lastName || ''}
                      </h3>
                      <span className="conversation-time">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="conversation-gig">
                      <span className="gig-label">Gig:</span>
                      <span className="gig-title">{lastMessage.gigId.title}</span>
                    </div>
                    <div className="conversation-bottom">
                      <p className="conversation-message">
                        {lastMessage.senderId._id === currentUserId && 'You: '}
                        {lastMessage.message}
                      </p>
                      {isUnread && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Right Side - Chat Area or Empty State */}
        <div className="messages-main">
          {selectedChat && currentUserId ? (
            <ChatWindow
              gigId={selectedChat.gigId}
              posterId={selectedChat.posterId}
              posterName={selectedChat.posterName}
              currentUserId={currentUserId}
              onClose={() => {
                setSelectedChat(null);
                fetchConversations();
              }}
              inline={true}
            />
          ) : (
            <div className="no-chat-selected">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M9 10h.01M15 10h.01M9.5 14.5s1 1 2.5 1 2.5-1 2.5-1" />
              </svg>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
