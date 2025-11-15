import './PostGigPage.css';
import Navbar from '../components/Navbar';
import Squares from '../components/Squares';
import GradientText from '../components/GradientText';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { gigAPI } from '../services/api';

export default function PostGigPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Design'
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const categories = [
    'Design',
    'Development',
    'Writing',
    'Marketing',
    'Video & Animation',
    'Music & Audio',
    'Business',
    'Data',
    'Photography',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setError('Only image files are allowed');
        return false;
      }
      if (!isValidSize) {
        setError('Each image must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Convert images to base64 strings
      const imageUrls = await Promise.all(
        images.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        })
      );
      
      const response = await gigAPI.createGig({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: imageUrls
      });

      if (response.success) {
        setToast({ message: 'Gig posted successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/tasku/browse');
        }, 1500);
      }
    } catch (err) {
      console.error('Error posting gig:', err);
      setError(err.response?.data?.message || 'Failed to post gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-gig-container">
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
      <div className="post-gig-content">
        <div className="post-gig-header">
          <h1 className="post-gig-title">
            <GradientText>Post a Gig</GradientText>
          </h1>
          <p className="post-gig-subtitle">
            Share your task and find the perfect person to complete it
          </p>
        </div>

        <form className="post-gig-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Gig Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              placeholder="e.g., Design a logo for my startup"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
            />
            <span className="char-count">{formData.title.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              id="category"
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Describe what you need done, requirements, and any specific details..."
              value={formData.description}
              onChange={handleChange}
              rows={6}
              maxLength={1000}
            />
            <span className="char-count">{formData.description.length}/1000</span>
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Price *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              className="form-input"
              placeholder="Enter price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
            <p className="form-hint">Set a fair price for your task</p>
          </div>

          <div className="form-group">
            <label htmlFor="images" className="form-label">
              Images (Optional)
            </label>
            <div className="image-upload-section">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-input"
                disabled={images.length >= 5}
              />
              <label htmlFor="images" className={`image-upload-label ${images.length >= 5 ? 'disabled' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>{images.length >= 5 ? 'Maximum 5 images' : 'Upload Images'}</span>
              </label>
              <p className="form-hint">Max 5 images, 5MB each</p>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/tasku')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Gig'}
            </button>
          </div>
        </form>

        <div className="post-gig-info">
          <h3>Tips for posting a great gig:</h3>
          <ul>
            <li>Be clear and specific about what you need</li>
            <li>Set a fair price based on the complexity</li>
            <li>Include all necessary requirements upfront</li>
            <li>Respond promptly to questions from workers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
