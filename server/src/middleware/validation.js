// Validate user profile update
const validateUserUpdate = (req, res, next) => {
  const { email, firstName, lastName } = req.body;

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  if (firstName && firstName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'First name must be at least 2 characters'
    });
  }

  if (lastName && lastName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Last name must be at least 2 characters'
    });
  }

  next();
};

// Validate gig creation
const validateGigCreation = (req, res, next) => {
  const { title, description, price, category } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Title must be at least 3 characters'
    });
  }

  if (!description || description.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Description must be at least 10 characters'
    });
  }

  if (!price || price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Price must be a positive number'
    });
  }

  if (!category || category.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Category is required'
    });
  }

  next();
};

// Validate product creation
const validateProductCreation = (req, res, next) => {
  const { name, description, basePrice } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Product name must be at least 3 characters'
    });
  }

  if (!description || description.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Description must be at least 10 characters'
    });
  }

  if (!basePrice || basePrice < 0) {
    return res.status(400).json({
      success: false,
      message: 'Base price must be a positive number'
    });
  }

  next();
};

// Validate bid placement
const validateBid = (req, res, next) => {
  const { bidAmount } = req.body;

  if (!bidAmount || bidAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Bid amount must be a positive number'
    });
  }

  next();
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateUserUpdate,
  validateGigCreation,
  validateProductCreation,
  validateBid
};
