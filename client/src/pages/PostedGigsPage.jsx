import './PostedGigsPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { gigAPI } from '../services/api';

export default function PostedGigsPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deletingGigId, setDeletingGigId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actioningGigId, setActioningGigId] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(null);

  useEffect(() => {
    fetchPostedGigs();
  }, []);

  const fetchPostedGigs = async () => {
    try {
      const response = await gigAPI.getMyGigs();
      console.log('Posted gigs:', response);
      if (response.success) {
        setGigs(response.gigs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posted gigs:', error);
      setLoading(false);
    }
  };

  const handleDeleteClick = (gigId, e) => {
    e.stopPropagation();
    setConfirmDelete(gigId);
  };

  const handleConfirmDelete = async () => {
    const gigId = confirmDelete;
    setConfirmDelete(null);

    try {
      setDeletingGigId(gigId);
      const response = await gigAPI.deleteGig(gigId);
      
      if (response.success) {
        setToast({ message: 'Gig deleted successfully!', type: 'success' });
        setGigs(gigs.filter(gig => gig._id !== gigId));
      }
    } catch (error) {
      console.error('Error deleting gig:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to delete gig', 
        type: 'error' 
      });
    } finally {
      setDeletingGigId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleApproveWork = async (e, gigId) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to approve this work? This will complete the gig.')) {
      return;
    }

    setActioningGigId(gigId);
    try {
      const token = await window.Clerk?.session?.getToken();
      const response = await fetch(`http://localhost:5000/api/gigs/${gigId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Work approved! Gig completed successfully.', type: 'success' });
        fetchPostedGigs();
      } else {
        setToast({ message: data.message || 'Failed to approve work', type: 'error' });
      }
    } catch (error) {
      console.error('Error approving work:', error);
      setToast({ message: 'Failed to approve work', type: 'error' });
    } finally {
      setActioningGigId(null);
    }
  };

  const handleRequestRevision = async (gigId) => {
    if (!revisionReason.trim()) {
      alert('Please provide a reason for the revision');
      return;
    }

    setActioningGigId(gigId);
    try {
      const token = await window.Clerk?.session?.getToken();
      const response = await fetch(`http://localhost:5000/api/gigs/${gigId}/request-revision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: revisionReason })
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: data.message, type: 'success' });
        setShowRevisionModal(null);
        setRevisionReason('');
        fetchPostedGigs();
      } else {
        setToast({ message: data.message || 'Failed to request revision', type: 'error' });
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
      setToast({ message: 'Failed to request revision', type: 'error' });
    } finally {
      setActioningGigId(null);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'in_progress': 'In Progress',
      'submitted': 'Submitted - Awaiting Review',
      'in_revision': 'In Revision',
      'completed': 'Completed',
      'active': 'Active',
      'inactive': 'Inactive'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="posted-gigs-container">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          message="Are you sure you want to delete this gig? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
      {showRevisionModal && (
        <div className="modal-overlay" onClick={() => setShowRevisionModal(null)}>
          <div className="revision-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Request Revision</h3>
            <p>Please explain what needs to be revised:</p>
            <textarea
              className="revision-textarea"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Describe the changes needed..."
              rows="5"
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowRevisionModal(null);
                  setRevisionReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="submit-btn"
                onClick={() => handleRequestRevision(showRevisionModal)}
                disabled={!revisionReason.trim() || actioningGigId}
              >
                {actioningGigId ? 'Requesting...' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={30}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="posted-gigs-content">
        <div className="posted-gigs-header">
          <h1 className="posted-gigs-title">
            <GradientText>Your Posted Gigs</GradientText>
          </h1>
          <p className="posted-gigs-subtitle">
            Manage the gigs you've posted
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading your posted gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="empty-state">
            <p>You haven't posted any gigs yet.</p>
            <button 
              className="post-button"
              onClick={() => navigate('/tasku/post')}
            >
              Post Your First Gig
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
                    {getStatusDisplay(gig.status)}
                  </span>
                </div>

                {gig.status === 'submitted' && (
                  <div className="review-notice">
                    <p>✨ Work has been submitted for your review</p>
                  </div>
                )}

                {gig.acceptedBy && (
                  <div className="gig-card-accepted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Accepted by a worker</span>
                  </div>
                )}

                <div className="gig-card-actions">
                  {gig.status === 'submitted' ? (
                    <>
                      <button 
                        className="approve-button"
                        onClick={(e) => handleApproveWork(e, gig._id)}
                        disabled={actioningGigId === gig._id}
                      >
                        {actioningGigId === gig._id ? 'Approving...' : '✓ Approve Work'}
                      </button>
                      {gig.revisionCount < gig.maxRevisions && (
                        <button 
                          className="revision-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRevisionModal(gig._id);
                          }}
                          disabled={actioningGigId === gig._id}
                        >
                          🔄 Request Revision ({gig.revisionCount}/{gig.maxRevisions})
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      className="delete-button"
                      onClick={(e) => handleDeleteClick(gig._id, e)}
                      disabled={deletingGigId === gig._id}
                    >
                      {deletingGigId === gig._id ? 'Deleting...' : 'Delete Gig'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
