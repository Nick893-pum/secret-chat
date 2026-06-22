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
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

socket.on("join-room", async ({ username, roomCode }) => {
  socket.join(roomCode);

  socket.data.username = username;
  socket.data.roomCode = roomCode;

  if (!rooms[roomCode]) {
    rooms[roomCode] = [];
  }

  rooms[roomCode].push({
    id: socket.id,
    username,
  });

  const room = await prisma.room.findUnique({
    where: {
      code: roomCode,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 100,
      },
    },
  });

  socket.emit(
    "message-history",
    room?.messages || []
  );

  io.to(roomCode).emit(
    "room-users",
    rooms[roomCode]
  );

  console.log(`${username} joined ${roomCode}`);
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
      throw new Error(
        "Missing roomCode or username on socket.data"
      );
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

    io.to(roomCode).emit("new-message", message);
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