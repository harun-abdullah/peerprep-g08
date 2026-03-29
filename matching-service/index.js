// dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const cors = require('cors');

require('dotenv').config();

// express server
const app = express();
app.use(cors());
const server = http.createServer(app);

// reddis client setup
const PORT = process.env.PORT || 3002;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// health check
app.get('/', (req, res) => {
  res.send('Matching Service is running');
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust later for production
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('find-match', async (data) => {
    const { userId, difficulty, category } = data;
    const queueKey = `queue:${difficulty}:${category}`;

    console.log(`User ${userId} looking for ${difficulty} match in ${category}`);

    // Simple matching logic: Check if there's a waiting user in the same queue
    const waitingUser = await redisClient.get(queueKey);

    // Match found, create room and notify both users
    if (waitingUser && waitingUser !== userId) {

      await redisClient.del(queueKey);
      
      const roomId = `room-${waitingUser}-${userId}-${Date.now()}`;
      
      io.to(socket.id).emit('match-found', { roomId, partnerId: waitingUser });
      io.to(waitingUser).emit('match-found', { roomId, partnerId: userId });
      
      console.log(`Match found: ${waitingUser} and ${userId}`);
    } else {
      // No match, join queue
      await redisClient.set(queueKey, socket.id, {
        EX: 30 // 30 seconds timeout
      });
      console.log(`User ${userId} joined queue: ${queueKey}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Matching Service listening on port ${PORT}`);
});
