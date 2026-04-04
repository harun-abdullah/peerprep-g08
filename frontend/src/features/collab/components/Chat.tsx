import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { Button } from "@heroui/react";

export default function Chat({ roomId }: { roomId: string }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        socket.emit("join_room", roomId);

        socket.on("receive_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [roomId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim()) return;
        socket.emit("send_message", { roomId, message });
        setMessage("");
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className="bg-blue-100 text-blue-900 p-2 rounded-lg max-w-xs break-words"
                    >
                        {m.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
        <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
                <Button variant="primary" onClick={sendMessage}>
                    Send
                </Button>
            </div>
        </div>
    );
}