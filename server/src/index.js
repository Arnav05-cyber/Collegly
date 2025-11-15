const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { clerkAuth } = require('./middleware/auth');
const { connectDB } = require('./utils/db');
const userRoutes = require('./routes/user');
const gigRoutes = require('./routes/gig');
const productRoutes = require('./routes/product');
const paymentRoutes = require('./routes/payment');
const chatRoutes = require('./routes/chat');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite ports
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkAuth);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io connection handling
const userSockets = new Map(); // Map userId to socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their userId
  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, receiverId, gigId, message } = data;

      // Save message to database
      const newMessage = await Message.create({
        conversationId,
        gigId,
        senderId,
        receiverId,
        message
      });

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('senderId', 'firstName lastName profileImage')
        .populate('receiverId', 'firstName lastName profileImage');

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      console.log(`Looking for receiver ${receiverId}, found socket: ${receiverSocketId}`);
      console.log('Active sockets:', Array.from(userSockets.entries()));
      
      if (receiverSocketId) {
        console.log(`Sending message to receiver socket ${receiverSocketId}`);
        io.to(receiverSocketId).emit('receive_message', populatedMessage);
      } else {
        console.log(`Receiver ${receiverId} is not online`);
      }

      // Send back to sender for confirmation
      socket.emit('message_sent', populatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.io is ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
