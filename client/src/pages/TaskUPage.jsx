import './TaskUPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import RotatingText from '../components/RotatingText';
import { useNavigate } from 'react-router-dom';

export default function TaskUPage() {
  const navigate = useNavigate();
  
  return (
    <div className="tasku-container">
      <Navbar />
      <Squares 
        direction="diagonal"
        speed={0.5}
        borderColor="rgba(122, 226, 207, 0.2)"
        squareSize={50}
        hoverFillColor="rgba(7, 122, 125, 0.3)"
      />
      <div className="tasku-content">
        <div className="tasku-hero-box">
          <h1 className="tasku-title">
            <GradientText>TaskU</GradientText>
          </h1>
          <p className="tasku-subtitle">
            <RotatingText 
              texts={[
                'Find gigs, earn money, build your future',
                'Connect with your college community',
                'Turn your skills into income',
                'Help others and get paid'  
              ]}
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </p>
        </div>
        
        <div className="tasku-sections">
          <div className="tasku-section" onClick={() => navigate('/tasku/browse')}>
            <h2>Browse Gigs</h2>
            <p>Discover opportunities posted by your peers</p>
          </div>
          <div className="tasku-section" onClick={() => navigate('/tasku/post')}>
            <h2>Post a Gig</h2>
            <p>Need help? Post a task and find workers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
