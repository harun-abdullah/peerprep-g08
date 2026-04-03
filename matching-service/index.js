const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const initSocketHandler = require('./socket/socketHandler');

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

// Initialize Socket Handler
initSocketHandler(io);

app.get('/', (req, res) => {
  res.send('Matching Service is running');
});

server.listen(PORT, () => {
  console.log(`Matching Service listening on port ${PORT}`);
});
