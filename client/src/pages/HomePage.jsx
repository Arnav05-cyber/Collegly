import '../App.css'
import './HomePage.css'
import Aurora from '../components/Aurora'
import Navbar from '../components/Navbar'
import TextType from '../components/TextType'
import Footer from '../components/Footer'
import GradientText from '../components/GradientText'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  // This will automatically sync user to backend when signed in
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Navbar />
      <Aurora 
        colorStops={['#077A7D', '#7AE2CF', '#06202B']}
        amplitude={1.0}
        blend={0.5}
      />
      <div className="content">
        <h1>Welcome to <GradientText>Collegly</GradientText></h1>
        {isSignedIn && user && (
          <p className="welcome-user">Hello, <GradientText>{user.firstName}</GradientText>!</p>
        )}
        <TextType
          text={[
            'Find gigs and earn money',
            'List products for auction',
            'Participate in exciting auctions',
            'Connect with your college community'
          ]}
          as="p"
          className="typing-text"
          typingSpeed={80}
          deletingSpeed={50}
          pauseDuration={2000}
          textColors={['#7AE2CF', '#F5EEDD', '#7AE2CF', '#F5EEDD']}
          cursorCharacter="|"
          cursorBlinkDuration={0.7}
        />
        
        {isSignedIn && (
          <div className="action-buttons">
            <button className="action-button tasku-button" onClick={() => navigate('/tasku')}>
              <span className="button-icon">💼</span>
              <GradientText className="button-text">TaskU</GradientText>
              <span className="button-subtitle">Find & Post Gigs</span>
            </button>
            <button className="action-button unima-button" onClick={() => navigate('/unima')}>
              <span className="button-icon">🛍️</span>
              <GradientText className="button-text">UniMa</GradientText>
              <span className="button-subtitle">Auction Marketplace</span>
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
