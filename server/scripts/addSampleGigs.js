const mongoose = require('mongoose');
require('dotenv').config();

const gigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  timeLimit: {
    type: Date,
    required: false
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Gig = mongoose.model('Gig', gigSchema);

const userSchema = new mongoose.Schema({
  clerkId: String,
  email: String,
  firstName: String,
  lastName: String,
  profileImage: String,
  roles: [String],
  acceptedGigs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gig' }],
  listedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function addSampleGigs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first user or create a sample user
    let user = await User.findOne();
    
    if (!user) {
      user = await User.create({
        clerkId: 'sample_user_123',
        email: 'sample@example.com',
        firstName: 'Sample',
        lastName: 'User',
        profileImage: '',
        roles: ['buyer']
      });
      console.log('Created sample user');
    }

    // Check if gigs already exist
    const existingGigs = await Gig.countDocuments();
    if (existingGigs > 0) {
      console.log(`Database already has ${existingGigs} gigs. Skipping...`);
      process.exit(0);
    }

    // Create sample gigs
    const sampleGigs = [
      {
        userId: user._id,
        title: 'Website Design Help Needed',
        description: 'Looking for someone to help design a modern landing page for my startup. Need someone with experience in UI/UX design and modern web aesthetics.',
        images: [],
        price: 75,
        category: 'Web Development',
        status: 'active',
        timeLimit: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        userId: user._id,
        title: 'Math Tutoring Session',
        description: 'Need help with Calculus II homework. Looking for someone who can explain concepts clearly and help with problem sets. One 2-hour session needed.',
        images: [],
        price: 40,
        category: 'Tutoring',
        status: 'active',
        timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    ];

    const createdGigs = await Gig.insertMany(sampleGigs);
    console.log(`Successfully added ${createdGigs.length} sample gigs!`);
    
    createdGigs.forEach(gig => {
      console.log(`- ${gig.title} ($${gig.price})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding sample gigs:', error);
    process.exit(1);
  }
}

addSampleGigs();
