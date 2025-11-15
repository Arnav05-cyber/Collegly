import './BrowseGigsPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { gigAPI } from '../services/api';

export default function BrowseGigsPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const gigsPerPage = 12;

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      console.log('Fetching gigs from API...');
      const response = await gigAPI.getAllGigs();
      console.log('API Response:', response);
      console.log('Gigs data:', response.gigs);
      if (response.success) {
        setGigs(response.gigs);
        console.log('Gigs set to state:', response.gigs.length);
      }
    } catch (error) {
      console.error('Error fetching gigs:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastGig = currentPage * gigsPerPage;
  const indexOfFirstGig = indexOfLastGig - gigsPerPage;
  const currentGigs = gigs.slice(indexOfFirstGig, indexOfLastGig);
  const totalPages = Math.ceil(gigs.length / gigsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="browse-gigs-container">
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={30}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="browse-gigs-content">
        {currentPage === 1 && (
          <>
            <h1 className="browse-gigs-title">
              <GradientText>Browse Gigs</GradientText>
            </h1>
            <p className="browse-gigs-subtitle">Discover opportunities from your college community</p>
          </>
        )}
        
        {loading ? (
          <p style={{ color: '#7AE2CF', textAlign: 'center', marginTop: '100px' }}>Loading gigs...</p>
        ) : gigs.length === 0 ? (
          <p style={{ color: '#7AE2CF', textAlign: 'center', marginTop: '100px' }}>No gigs available yet. Be the first to post one!</p>
        ) : (
          <>
            <div className="gigs-grid">
              {currentGigs.map((gig) => (
                <div key={gig._id} className="gig-card">
                  <h3>{gig.title}</h3>
                  <p>{gig.description}</p>
                  <div className="gig-footer">
                    <span className="gig-price">{gig.price}</span>
                    <button 
                      className={`gig-button ${gig.acceptedBy ? 'accepted' : ''}`}
                      onClick={() => navigate(`/tasku/gig/${gig._id}`)}
                    >
                      {gig.acceptedBy ? 'Accepted' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-arrow"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="pagination-numbers">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => handlePageClick(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button 
                  className="pagination-arrow"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
