import './AcceptedGigsPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { gigAPI } from '../services/api';

export default function AcceptedGigsPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcceptedGigs();
  }, []);

  const fetchAcceptedGigs = async () => {
    try {
      const response = await gigAPI.getAcceptedGigs();
      console.log('Accepted gigs:', response);
      if (response.success) {
        setGigs(response.gigs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accepted gigs:', error);
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (acceptedAt) => {
    if (!acceptedAt) return 'N/A';
    
    const accepted = new Date(acceptedAt);
    const deadline = new Date(accepted.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const now = new Date();
    const remaining = deadline - now;
    
    if (remaining < 0) return 'Expired';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatDeadline = (acceptedAt) => {
    if (!acceptedAt) return 'N/A';
    
    const accepted = new Date(acceptedAt);
    const deadline = new Date(accepted.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="accepted-gigs-container">
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={30}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="accepted-gigs-content">
        <div className="accepted-gigs-header">
          <h1 className="accepted-gigs-title">
            <GradientText>Your Accepted Gigs</GradientText>
          </h1>
          <p className="accepted-gigs-subtitle">
            Track your ongoing tasks and deadlines
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading your accepted gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="empty-state">
            <p>You haven't accepted any gigs yet.</p>
            <button 
              className="browse-button"
              onClick={() => navigate('/tasku/browse')}
            >
              Browse Available Gigs
            </button>
          </div>
        ) : (
          <div className="gigs-grid">
            {gigs.map((gig) => (
              <div 
                key={gig._id} 
                className="gig-card"
                onClick={() => navigate(`/tasku/gig/${gig._id}`)}
              >
                <div className="gig-card-header">
                  <h3 className="gig-card-title">{gig.title}</h3>
                  <span className="gig-card-price">{gig.price}</span>
                </div>
                
                <p className="gig-card-description">{gig.description}</p>
                
                <div className="gig-card-meta">
                  <span className="gig-card-category">{gig.category}</span>
                  <span className={`gig-card-status ${gig.status}`}>
                    {gig.status}
                  </span>
                </div>

                <div className="gig-card-deadline">
                  <div className="deadline-info">
                    <span className="deadline-label">Deadline:</span>
                    <span className="deadline-date">{formatDeadline(gig.acceptedAt)}</span>
                  </div>
                  <div className="time-remaining">
                    <span className="time-remaining-label">Time Left:</span>
                    <span className="time-remaining-value">
                      {calculateTimeRemaining(gig.acceptedAt)}
                    </span>
                  </div>
                </div>

                <div className="gig-card-poster">
                  <div className="poster-avatar-small">
                    {gig.userId?.firstName?.[0]}{gig.userId?.lastName?.[0]}
                  </div>
                  <span className="poster-name-small">
                    Posted by {gig.userId?.firstName} {gig.userId?.lastName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
