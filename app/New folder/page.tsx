"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const [joined, setJoined] = useState(false);

  useEffect(() => {
    socket.on("new-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("new-message");
    };
  }, []);

  const joinRoom = () => {
    if (!username || !roomCode) return;

    socket.connect();

    socket.emit("join-room", {
      username,
      roomCode,
    });

    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", message);

    setMessage("");
  };

  if (!joined) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl mb-4">Join Chat Room</h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2"
          onClick={joinRoom}
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-xl mb-4">
        Room: {roomCode}
      </h2>

      <div className="border h-96 overflow-y-auto p-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          className="bg-green-500 text-white px-4"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
export default function ChatPage() {
  return <div>Hello</div>;
}export default function ChatPage() {
  return <div>Hello</div>;
}