const { handleFindMatch, handleDisconnect } = require('../controllers/matchController');

const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('find-match', (data) => {
      handleFindMatch(io, socket, data);
    });

    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
  });
};

module.exports = initSocketHandler;
