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
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setToast({ message: 'Please select at least one file', type: 'error' });
      return;
    }

    setUploadingFile(true);
    try {
      const token = await window.Clerk?.session?.getToken();
      
      // Upload each file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('gigId', gig._id);
        formData.append('receiverId', gig.userId._id);
        formData.append('message', `Uploaded file: ${file.name}`);

        const response = await fetch('http://localhost:5000/api/chat/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to upload file');
        }
      }

      setToast({ message: 'Files uploaded successfully!', type: 'success' });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setToast({ message: error.message || 'Failed to upload files', type: 'error' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!window.confirm('Are you sure you want to submit your work? The gig poster will review it.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = await window.Clerk?.session?.getToken();
      const response = await fetch(`http://localhost:5000/api/gigs/${gig._id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Work submitted successfully! Waiting for review.', type: 'success' });
        fetchGig();
      } else {
        setToast({ message: data.message || 'Failed to submit work', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      setToast({ message: 'Failed to submit work', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'in_progress': 'In Progress',
      'submitted': 'Submitted - Under Review',
      'in_revision': 'Revision Requested',
      'completed': 'Completed',
      'active': 'Active',
      'inactive': 'Inactive'
    };
    return statusMap[status] || status;
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
  const isAcceptor = currentUserMongoId && gig.acceptedBy && (gig.acceptedBy._id === currentUserMongoId || gig.acceptedBy === currentUserMongoId);
  const canSubmitWork = isAcceptor && (gig.status === 'in_progress' || gig.status === 'in_revision' || gig.status === 'active') && gig.status !== 'completed' && gig.status !== 'submitted';

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
          canUploadFiles={gig.acceptedBy?._id === currentUserMongoId || gig.acceptedBy === currentUserMongoId}
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
            <span className={`gig-status ${gig.status}`}>
              Status: {getStatusDisplay(gig.status)}
            </span>
          </div>

          {gig.status === 'in_revision' && gig.revisionHistory?.length > 0 && isAcceptor && (
            <div className="revision-alert">
              <h3>⚠️ Revision Requested ({gig.revisionCount}/{gig.maxRevisions})</h3>
              <p>{gig.revisionHistory[gig.revisionHistory.length - 1].reason}</p>
            </div>
          )}

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

          {canSubmitWork && (
            <div className="submit-work-section">
              <h2>Submit Your Work</h2>
              <p className="section-description">Upload your completed work files and submit for review</p>
              
              <div className="file-upload-area">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Choose Files to Upload</span>
                </label>

                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    <h4>Selected Files ({selectedFiles.length})</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                        <button 
                          className="remove-file-btn"
                          onClick={() => handleRemoveFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <button
                    className="upload-files-btn"
                    onClick={handleUploadFiles}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                  </button>
                )}
              </div>

              <button
                className="submit-work-btn-large"
                onClick={handleSubmitWork}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '✓ Submit Work for Review'}
              </button>
            </div>
          )}

          <div className="gig-actions">
            {!isOwner && !isAccepted && (
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
