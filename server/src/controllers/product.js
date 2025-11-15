const Product = require('../models/Product');
const User = require('../models/User');

// Create/List a new product
const createProduct = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { name, description, images, basePrice, auctionEndTime } = req.body;

    // Find user by clerkId to get MongoDB _id
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const product = await Product.create({
      userId: user._id,
      name,
      description,
      images: images || [],
      basePrice,
      currentPrice: basePrice,
      auctionEndTime: auctionEndTime || null
    });

    // Add product to user's listedProducts and add product_lister role if not present
    user.listedProducts.push(product._id);
    if (!user.roles.includes('product_lister')) {
      user.roles.push('product_lister');
    }
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      product: product,
      roles: user.roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Get all available products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'available' })
      .populate('userId', 'firstName lastName email profileImage')
      .populate('highestBidder', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('userId', 'firstName lastName email profileImage')
      .populate('highestBidder', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;
    const updates = req.body;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find product and check ownership
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Don't allow updating if product is already bought
    if (product.status === 'bought') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a product that has been bought'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find product and check ownership
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(id);

    // Remove from user's listedProducts
    user.listedProducts = user.listedProducts.filter(
      p => p.toString() !== id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Place a bid on a product
const placeBid = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;
    const { bidAmount } = req.body;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This product is no longer available for bidding'
      });
    }

    // Check if user is trying to bid on their own product
    if (product.userId.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot bid on your own product'
      });
    }

    // Check if auction has ended
    if (product.auctionEndTime && new Date() > new Date(product.auctionEndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Auction has ended for this product'
      });
    }

    // Validate bid amount
    if (!bidAmount || bidAmount <= product.currentPrice) {
      return res.status(400).json({
        success: false,
        message: `Bid must be higher than current price of ${product.currentPrice}`
      });
    }

    // Update product with new bid
    product.currentPrice = bidAmount;
    product.highestBidder = user._id;
    await product.save();

    res.json({
      success: true,
      message: 'Bid placed successfully',
      product: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error placing bid',
      error: error.message
    });
  }
};

// Buy product (accept current bid or buy outright)
const buyProduct = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This product is no longer available'
      });
    }

    // Only the product owner can finalize the sale
    if (product.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the product owner can finalize the sale'
      });
    }

    // Check if there's a highest bidder
    if (!product.highestBidder) {
      return res.status(400).json({
        success: false,
        message: 'No bids have been placed on this product'
      });
    }

    // Mark product as bought
    product.status = 'bought';
    await product.save();

    res.json({
      success: true,
      message: 'Product sold successfully',
      product: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error buying product',
      error: error.message
    });
  }
};

// Get user's own listed products
const getMyProducts = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const products = await Product.find({ userId: user._id })
      .populate('highestBidder', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your products',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  placeBid,
  buyProduct,
  getMyProducts
};
