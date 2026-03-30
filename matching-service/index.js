const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

// set up http server and socket.io
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Key : queue:language:category:difficulty | Value : list of socket ids waiting for that criteria
const redisClient = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Key : socket.id | Value : timeout object
const timeouts = new Map(); 

// Key : socket.id (unique id of current socket): Value :queueKey (Full string of the redis list)
const socketToQueueMap = new Map(); 

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

app.get('/', (req, res) => {
  res.send('Matching Service is running');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('find-match', async (data) => {
    // Prevent duplicate queue entries (Double Click buttons)
    if (socketToQueueMap.has(socket.id)) {
        return socket.emit('error', { message: 'You are already searching for a match.' });
    }
    const { userId, difficulty, category, language } = data;
    const queueKey = `queue:${language}:${category}:${difficulty}`;

    console.log(`User ${userId} looking for ${language}/${difficulty} match in ${category}`);

    const waitingSocketId = await redisClient.lPop(queueKey);

    // Match found
    if (waitingSocketId && waitingSocketId !== socket.id) {
      const roomId = `room-${waitingSocketId}-${socket.id}-${Date.now()}`;
      
      // Clear the timeout for the waiting user
      const waitingTimeout = timeouts.get(waitingSocketId);
      if (waitingTimeout) {
        clearTimeout(waitingTimeout);
        timeouts.delete(waitingSocketId);
      }
      socketToQueueMap.delete(waitingSocketId);

      // Notify both users
      io.to(socket.id).emit('match-found', { roomId, partnerId: waitingSocketId });
      io.to(waitingSocketId).emit('match-found', { roomId, partnerId: socket.id });
      
      console.log(`Match found: ${waitingSocketId} and ${socket.id}`);
    } else {
      // No match, join queue
      await redisClient.rPush(queueKey, socket.id);
      socketToQueueMap.set(socket.id, queueKey);

      // Clear if user disconnects or finds a match before timeout
      const timeoutId = setTimeout(async () => {
        await redisClient.lRem(queueKey, 0, socket.id);
        socket.emit('match-timeout', { message: 'No match found within 30s' });
        timeouts.delete(socket.id);
        socketToQueueMap.delete(socket.id);
        console.log(`User ${socket.id} timed out from queue: ${queueKey}`);
      }, 30000); 

      timeouts.set(socket.id, timeoutId);
      console.log(`User ${userId} joined queue: ${queueKey}`);
    }
  });

  // User can disconnect/close device and someone else could match with ghost socket. 
  socket.on('disconnect', async () => {
    // Clean up from queue if still present
    const queueKey = socketToQueueMap.get(socket.id);
    if (queueKey) {
      await redisClient.lRem(queueKey, 0, socket.id);
      console.log(`Cleaned up ghost socket ${socket.id} from ${queueKey}`);
    }

    const timeoutId = timeouts.get(socket.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.delete(socket.id);
    }
    socketToQueueMap.delete(socket.id);
    
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Matching Service listening on port ${PORT}`);
});
