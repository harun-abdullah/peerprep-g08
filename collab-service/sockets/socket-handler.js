import CollabRoomModel from "../model/collab-room-model.js";

// roomId : Map<userId, socketId>
// to keep track of currently active connections to handle reconnects/disconnects etc
const activeConnections = new Map();

export function clearActiveConnections() {
  activeConnections.clear();
}

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", async (roomId, userData) => {
      if (!roomId) {
        socket.emit("join_error", { message: "Room ID is required" });
        return;
      }

      const userId = userData?.id;
      if (!userId) {
        socket.emit("join_error", { message: "User ID is required" });
        return;
      }

      if (!activeConnections.has(roomId)) {
        activeConnections.set(roomId, new Map());
      }
      const roomConnections = activeConnections.get(roomId);

      // TODO: implement this listener in frontend
      if (roomConnections.has(userId)) {
        socket.emit("join_error", {
          message: "Already connected in another tab",
        });
        return;
      }

      roomConnections.set(userId, socket.id);
      socket.roomId = roomId;
      socket.userId = userId;

      socket.join(roomId);

      // Load persisted messages from database
      const messages = await CollabRoomModel.getMessages(roomId);
      socket.emit("load_messages", messages);
    });

    socket.on(
      "send_message",
      async ({ roomId, message, senderUsername, senderId } = {}) => {
        // TODO: add an "error" event here, and a listener to the "error" event in frontend in case of no room ID
        if (!roomId) return;

        const msg = {
          id: Date.now(),
          text: message,
          senderUsername: senderUsername || "Unknown",
          senderId: senderId || socket.id,
        };

        await CollabRoomModel.addMessage(roomId, msg);

        io.to(roomId).emit("receive_message", msg);
      },
    );

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      const { roomId, userId } = socket;
      if (roomId && userId) {
        const roomConnections = activeConnections.get(roomId);
        if (roomConnections) {
          roomConnections.delete(userId);
          if (roomConnections.size === 0) {
            activeConnections.delete(roomId);
          }
        }
        // TODO: add listener to user_disconnected event in frontend
        socket.to(roomId).emit("user_disconnected", { userId });
      }
    });
  });
}
