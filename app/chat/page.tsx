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
useEffect(() => {
  console.log(
    "MESSAGES STATE CHANGED:",
    messages.length,
    messages
  );
}, [messages]);
  const [users, setUsers] = useState<User[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  function addLog(msg: string) {
  console.log(msg);

  setDebugLogs((prev) => [
    ...prev.slice(-30),
    `${new Date().toLocaleTimeString()} | ${msg}`,
  ]);
}
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
  addLog(`CONNECTED ${socket.id}`);
});

    socket.on("disconnect", () => {
  addLog("DISCONNECTED");
});

socket.on("connect_error", (err) => {
  addLog(`CONNECT ERROR ${err.message}`);
});

    socket.on("join-success", () => {
      addLog("JOIN SUCCESS");
      setJoined(true);
    });

    socket.on("message-history", (history: Message[]) => {
  addLog(
    `MESSAGE HISTORY ${history?.length ?? 0}`
  );

  setMessages(
    Array.isArray(history)
      ? history
      : []
  );
});

    socket.on("new-message", (newMessage: Message) => {
  addLog(
    `NEW MESSAGE RECEIVED ${newMessage.username}: ${newMessage.text}`
  );

  setMessages((prev) => {
    const exists = prev.some(
      (m) => m.id === newMessage.id
    );

    if (exists) {
      return prev;
    }

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
    console.log(
  "RENDER CHAT",
  messages.length,
  users.length
);
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
<div className="flex-1 border rounded-lg p-4 flex flex-col h-[80vh]">

  <div className="text-xs text-red-500 mb-2">
    Connected: {String(socket.connected)}
    <br />
    Messages: {messages.length}
    <br />
    Users: {users.length}
  </div>

  {/* DEBUG LOGS */}
  <div className="border rounded p-2 mb-3 h-32 overflow-y-auto bg-black text-green-400 text-[10px]">
    {debugLogs.map((log, index) => (
      <div key={index}>{log}</div>
    ))}
  </div>

  {/* MESSAGE LIST */}
  <div className="flex-1 overflow-y-auto space-y-3 mb-4">

    {messages.length === 0 ? (
      <p>No messages yet.</p>
    ) : (
      messages.map((msg, index) => (
        <div
          key={msg.id || msg.createdAt + index}
          className="border rounded p-3"
        >
          <div className="flex justify-between mb-1">
            <strong>{msg.username}</strong>

            <span className="text-xs">
              {String(msg.createdAt)}
            </span>
          </div>

          <p>{msg.text}</p>
        </div>
      ))
    )}

    <div ref={messagesEndRef} />

  </div>

  {/* INPUT */}
  <div className="flex gap-2">

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