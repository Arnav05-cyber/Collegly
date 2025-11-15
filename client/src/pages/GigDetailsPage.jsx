import './GigDetailsPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import Toast from '../components/Toast';
import ChatWindow from '../components/ChatWindow';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { gigAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function GigDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [currentUserMongoId, setCurrentUserMongoId] = useState(null);

  useEffect(() => {
    fetchGig();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const token = await window.Clerk?.session?.getToken();
      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUserMongoId(data.user._id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchGig = async () => {
    try {
      const response = await gigAPI.getGigById(id);
      console.log('Fetched gig:', response);
      if (response.success) {
        setGig(response.gig);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gig:', error);
      setLoading(false);
    }
  };

  const handleAcceptGig = async () => {
    try {
      setAccepting(true);
      const response = await gigAPI.acceptGig(id);
      if (response.success) {
        setToast({ message: 'Gig accepted successfully!', type: 'success' });
        fetchGig(); // Refresh gig data
      }
    } catch (error) {
      console.error('Error accepting gig:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to accept gig', 
        type: 'error' 
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="gig-details-container">
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
        <Navbar />
        <Squares 
          direction="diagonal"
          speed={0.5}
          borderColor="rgba(122, 226, 207, 0.2)"
          squareSize={30}
          hoverFillColor="rgba(7, 122, 125, 0.3)"
        />
        <div className="gig-details-content">
          <p style={{ color: '#7AE2CF', textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="gig-details-container">
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
        <Navbar />
        <Squares 
          direction="diagonal"
          speed={0.5}
          borderColor="rgba(122, 226, 207, 0.2)"
          squareSize={30}
          hoverFillColor="rgba(7, 122, 125, 0.3)"
        />
        <div className="gig-details-content">
          <p style={{ color: '#7AE2CF', textAlign: 'center' }}>Gig not found</p>
        </div>
      </div>
    );
  }

  const isAccepted = gig.acceptedBy !== null;
  const isOwner = user && gig.userId.email === user.primaryEmailAddress?.emailAddress;

  return (
    <div className="gig-details-container">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      {showChat && gig && currentUserMongoId && (
        <ChatWindow
          gigId={gig._id}
          posterId={gig.userId._id}
          posterName={`${gig.userId.firstName} ${gig.userId.lastName}`}
          currentUserId={currentUserMongoId}
          onClose={() => setShowChat(false)}
        />
      )}
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={30}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="gig-details-content">
        <button className="back-button" onClick={() => navigate('/tasku/browse')}>
          ← Back to Browse
        </button>

        <div className="gig-details-card">
          <div className="gig-header">
            <h1 className="gig-title">
              <GradientText>{gig.title}</GradientText>
            </h1>
            <span className="gig-price-large">{gig.price}</span>
          </div>

          <div className="gig-meta">
            <span className="gig-category">Category: {gig.category}</span>
            <span className={`gig-status ${isAccepted ? 'accepted' : ''}`}>
              Status: {isAccepted ? 'Accepted' : 'Active'}
            </span>
          </div>

          <div className="gig-section">
            <h2>Description</h2>
            <p>{gig.description}</p>
          </div>

          <div className="gig-section">
            <h2>Requirements</h2>
            <ul>
              <li>Complete the task as described</li>
              <li>Maintain quality standards</li>
              <li>Meet the deadline</li>
            </ul>
          </div>

          <div className="gig-section">
            <h2>Time Limit</h2>
            <p>Complete within 7 days</p>
          </div>

          <div className="gig-section">
            <h2>Posted By</h2>
            <div className="poster-info">
              <div className="poster-avatar">
                {gig.userId.firstName[0]}{gig.userId.lastName[0]}
              </div>
              <div>
                <p className="poster-name">{gig.userId.firstName} {gig.userId.lastName}</p>
                <p className="poster-email">{gig.userId.email}</p>
              </div>
            </div>
          </div>

          <div className="gig-actions">
            {!isOwner && (
              <button 
                className={`accept-button ${isAccepted ? 'accepted' : ''}`}
                onClick={handleAcceptGig}
                disabled={isAccepted || accepting}
              >
                {accepting ? 'Accepting...' : isAccepted ? 'Accepted' : 'Accept Gig'}
              </button>
            )}
            {!isOwner && (
              <button 
                className="contact-button"
                onClick={() => setShowChat(true)}
              >
                Contact Poster
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
