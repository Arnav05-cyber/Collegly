import './GradientText.css';

export default function GradientText({ children, className = '', gradient = 'linear-gradient(135deg, #7AE2CF, #077A7D)' }) {
  return (
    <span 
      className={`gradient-text ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {children}
    </span>
  );
}
