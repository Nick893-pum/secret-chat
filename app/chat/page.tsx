"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";

type Message = {
  username: string;
  text: string;
  createdAt: string;
};

type User = {
  id: string;
  username: string;
};

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  console.log(
    "Socket URL:",
    process.env.NEXT_PUBLIC_SOCKET_URL
  );

  socket.connect();

  socket.on("connect", () => {
    console.log("CONNECTED", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("CONNECT ERROR", err);
  });

  return () => {
    socket.off("connect");
    socket.off("connect_error");
  };
}, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function joinRoom() {
    if (!username.trim() || !roomCode.trim()) {
      alert("Please enter your name and room code.");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", {
      username: username.trim(),
      roomCode: roomCode.trim().toUpperCase(),
    });

    setJoined(true);
  }

  function sendMessage() {
    if (!message.trim()) return;

    socket.emit("send-message", message.trim());

    setMessage("");
  }

  function leaveRoom() {
    socket.disconnect();

    setJoined(false);
    setMessages([]);
    setUsers([]);
    setMessage("");
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md border rounded-lg p-6 shadow">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Secret Chat
          </h1>

          <input
            className="w-full border rounded p-3 mb-4"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full border rounded p-3 mb-6"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.toUpperCase())
            }
          />

          <button
            className="w-full bg-blue-600 text-white rounded p-3 hover:bg-blue-700"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar */}
          <div className="w-full md:w-64 border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">
              Room: {roomCode}
            </h2>

            <p className="mb-4">Welcome, {username}</p>

            <h3 className="font-semibold mb-2">
              Online ({users.length})
            </h3>

            <ul className="space-y-2 mb-6">
              {users.map((user) => (
                <li key={user.id}>
                  • {user.username}
                </li>
              ))}
            </ul>

            <button
              className="w-full bg-red-500 text-white rounded p-2 hover:bg-red-600"
              onClick={leaveRoom}
            >
              Leave Room
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 border rounded-lg p-4 flex flex-col h-[80vh]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 ? (
                <p className="text-gray-500">
                  No messages yet.
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className="border rounded p-3"
                  >
                    <div className="flex justify-between mb-1">
                      <strong>{msg.username}</strong>

                      <span className="text-xs text-gray-500">
                        {new Date(
                          msg.createdAt
                        ).toLocaleTimeString()}
                      </span>
                    </div>

                    <p>{msg.text}</p>
                  </div>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 border rounded p-3"
                placeholder="Type a message..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />

              <button
                className="bg-green-600 text-white rounded px-6 hover:bg-green-700"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}