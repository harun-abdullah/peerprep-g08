import { rooms } from "../utils/room-store.js";

export default function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join_room", (roomId) => {
            socket.join(roomId);
        });

        socket.on("send_message", ({ roomId, message }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            const msg = {
                id: Date.now(),
                text: message,
            };

            room.messages.push(msg);

            io.to(roomId).emit("receive_message", msg);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}