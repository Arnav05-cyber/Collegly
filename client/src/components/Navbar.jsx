import './Navbar.css';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showGigsDropdown, setShowGigsDropdown] = useState(false);
  
  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="brand-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="brand-text">Collegly</span>
          </div>
        </div>
        <div className="navbar-right">
          <SignedOut>
            <button className="join-button" onClick={() => navigate('/sign-in')}>
              Join Now
            </button>
          </SignedOut>
          <SignedIn>
            {!isHomePage && (
              <>
                <button className="post-gig-button" onClick={() => navigate('/tasku/post')}>
                  Post Gig
                </button>
                <button className="messages-button" onClick={() => navigate('/tasku/messages')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Messages
                </button>
                <div className="gigs-dropdown-container">
                  <button 
                    className="my-gigs-button" 
                    onClick={() => setShowGigsDropdown(!showGigsDropdown)}
                  >
                    My Gigs ▾
                  </button>
                  {showGigsDropdown && (
                    <div className="gigs-dropdown">
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/tasku/browse');
                          setShowGigsDropdown(false);
                        }}
                      >
                        Browse Gigs
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/tasku/accepted');
                          setShowGigsDropdown(false);
                        }}
                      >
                        Accepted Gigs
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/tasku/posted');
                          setShowGigsDropdown(false);
                        }}
                      >
                        Posted Gigs
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'user-avatar',
                },
                variables: {
                  colorPrimary: '#7AE2CF',
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
