const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const prisma = require("./prisma");

const app = express();

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id,
    "Transport:",
    socket.conn.transport.name
  );

socket.on("join-room", async ({ username, roomCode }) => {
  try {
    console.log("JOIN ROOM:", {
      username,
      roomCode,
      socketId: socket.id,
    });

    socket.join(roomCode);

    socket.data.username = username;
    socket.data.roomCode = roomCode;

    if (!rooms[roomCode]) {
      rooms[roomCode] = [];
    }

    const existingUser = rooms[roomCode].find(
      (u) => u.id === socket.id
    );

    if (!existingUser) {
      rooms[roomCode].push({
        id: socket.id,
        username,
      });
    }

await prisma.message.deleteMany({
  where: {
    createdAt: {
      lt: new Date(
        Date.now() -
          24 * 60 * 60 * 1000
      ),
    },
  },
});

    const room = await prisma.room.findUnique({
  where: {
    code: roomCode,
  },
  include: {
    messages: {
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    },
  },
});

const history =
  room?.messages
    .reverse()
    .map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })) || [];

    socket.emit(
  "message-history",
  room?.messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  })) || []
);

    io.to(roomCode).emit(
      "room-users",
      rooms[roomCode]
    );

    // IMPORTANT
    socket.emit("join-success");

    console.log(`${username} joined ${roomCode}`);
  } catch (error) {
    console.error("JOIN ROOM ERROR");
    console.error(error);
  }
});

socket.on("typing", () => {
  const roomCode = socket.data.roomCode;
  const username = socket.data.username;

  if (!roomCode || !username) return;

  socket
    .to(roomCode)
    .emit("typing", username);
});

  socket.on("send-message", async (text) => {
  try {
    const roomCode = socket.data.roomCode;
    const username = socket.data.username;

    console.log("Saving message:", {
      username,
      roomCode,
      text,
    });

    if (!roomCode || !username) {
  console.log(
    "Message rejected: user has not joined room yet"
  );

  return;
}

    const room = await prisma.room.upsert({
      where: {
        code: roomCode,
      },
      update: {},
      create: {
        code: roomCode,
      },
    });

    console.log("Room found or created:", room);

    const message = await prisma.message.create({
      data: {
        username,
        text,
        roomId: room.id,
      },
    });

    console.log("Message saved:", message);

    console.log(
  "EMITTING TO ROOM:",
  roomCode,
  message
);
console.log(
  "EMITTING TO ROOM:",
  roomCode
);

io.to(roomCode).emit("new-message", {
  id: message.id,
  username: message.username,
  text: message.text,
  createdAt: message.createdAt.toISOString(),
});
  } catch (error) {
    console.error("SEND MESSAGE ERROR:");
    console.error(error);
  }
});

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;

    if (!roomCode || !rooms[roomCode]) {
      return;
    }

    rooms[roomCode] = rooms[roomCode].filter(
      (user) => user.id !== socket.id
    );

    io.to(roomCode).emit(
      "room-users",
      rooms[roomCode]
    );

    if (rooms[roomCode].length === 0) {
      delete rooms[roomCode];
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});