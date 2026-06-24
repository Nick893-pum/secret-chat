"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";

type Message = {
  id?: string;
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
  
  // ==========================
  // SOCKET INIT
  // ==========================
  useEffect(() => {
    console.log(
      "Socket URL:",
      process.env.NEXT_PUBLIC_SOCKET_URL
    );

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
  console.log("CONNECTED", socket.id);
});

    socket.on("disconnect", () => {
  console.log("DISCONNECTED");
});

socket.on("connect_error", (err) => {
  console.error("CONNECT ERROR", err);
});

    socket.on("join-success", () => {
  setJoined(true);
});
socket.on("message-history", (history: Message[]) => {
  console.log(
    "MESSAGE HISTORY",
    history.length
  );

  setMessages(history);
});
<div>
  Messages: {messages.length}
</div>
    socket.on("message-history", (history: Message[]) => {
  setMessages(
    Array.isArray(history)
      ? history
      : []
  );
});

    socket.on("new-message", (newMessage: Message) => {
  setMessages((prev) => {
    const exists = prev.some(
      (m) => m.id === newMessage.id
    );

    if (exists) return prev;

    return [...prev, newMessage];
  });
});

    socket.on("room-users", (roomUsers: User[]) => {
      console.log("ROOM USERS", roomUsers);

      setUsers(
        Array.isArray(roomUsers)
          ? roomUsers
          : []
      );
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("join-success");
      socket.off("message-history");
      socket.off("new-message");
      socket.off("room-users");
    };
  }, []);

  // ==========================
  // AUTO SCROLL
  // ==========================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================
  // JOIN ROOM
  // ==========================
  function joinRoom() {
    if (!username.trim()) {
      alert("Enter username");
      return;
    }

    if (!roomCode.trim()) {
      alert("Enter room code");
      return;
    }

    console.log("JOINING ROOM");

    socket.emit("join-room", {
      username: username.trim(),
      roomCode: roomCode
        .trim()
        .toUpperCase(),
    });
  }

  // ==========================
  // SEND MESSAGE
  // ==========================
  function sendMessage() {
    const text = message.trim();

    if (!text) return;

    socket.emit(
      "send-message",
      text
    );

    setMessage("");
  }

  // ==========================
  // LEAVE ROOM
  // ==========================
  function leaveRoom() {
    socket.disconnect();

    setJoined(false);
    setMessages([]);
    setUsers([]);
    setMessage("");

    setTimeout(() => {
      socket.connect();
    }, 500);
  }

  // ==========================
  // LOGIN PAGE
  // ==========================
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
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

          <input
            className="w-full border rounded p-3 mb-6"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value.toUpperCase()
              )
            }
          />

          <button
            className="w-full bg-blue-600 text-white rounded p-3"
            onClick={joinRoom}
          >
            Join Room
          </button>

        </div>
      </div>
    );
  }

  // ==========================
  // CHAT PAGE
  // ==========================
  return (
    <div className="min-h-screen p-4">
<div
  style={{
    background: "red",
    color: "white",
    padding: 20,
    fontSize: 24,
  }}
>
  TEST BUILD 999
</div>
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col md:flex-row gap-4">

          {/* SIDEBAR */}
          <div className="w-full md:w-64 border rounded-lg p-4">

            <h2 className="text-xl font-bold mb-2">
              Room: {roomCode}
            </h2>

            <p className="mb-4">
              Welcome, {username}
            </p>

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
              className="w-full bg-red-500 text-white rounded p-2"
              onClick={leaveRoom}
            >
              Leave Room
            </button>

          </div>

          {/* CHAT PANEL */}
<div className="flex-1 border rounded-lg p-4 flex flex-col h-[80vh] min-h-0">

  {/* MESSAGE LIST */}
  <div
    className="flex-1 overflow-y-auto min-h-0"
    style={{
      WebkitOverflowScrolling: "touch",
    }}
  >
    <div className="text-red-500 text-sm mb-2">
  Messages: {messages.length}
</div>
    {messages.length === 0 ? (
      <p>No messages yet.</p>
    ) : (
      <div className="space-y-3">
        {messages.map((msg, index) => (
          <div
            key={
              msg.id ??
              `${msg.createdAt}-${index}`
            }
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
        ))}
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>

  {/* INPUT */}
  <div className="flex gap-2 mt-4">
    <input
      className="flex-1 border rounded p-3"
      value={message}
      placeholder="Type a message..."
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
      className="bg-green-600 text-white rounded px-6"
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