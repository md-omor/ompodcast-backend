require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://ompodcast.vercel.app"],
    methods: ["GET", "POST"],
  },
});
const ACTIONS = require("./actions");

const router = require("./routes");

const PORT = process.env.PORT || 8000;

app.use(cookieParser());
app.use(express.json({ limit: "40mb" }));
app.use(
  cors({
    origin: ["http://localhost:3000", "https://ompodcast.vercel.app"],
    credentials: true,
  })
);
app.use(router);

app.use("/storage", express.static("storage"));

app.get("/", (req, res) => res.send("Welcome to md omor Podcast API"));

// Sockets;

const socketUserMapping = {};

io.on("connection", (socket) => {
  console.log("new connection", socket.id);

  // handle connects
  socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
    socketUserMapping[socket.id] = user;
    // new map it's mean get clients from a specific roomId
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    // fetch all users to the rooms with sockets
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
        user,
      });

      // add my self to the list of peers
      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
        user: socketUserMapping[clientId],
      });
    });

    socket.join(roomId);
    console.log(clients);
  });

  // Handle relay ice
  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });

  // handle realy sdp (session descriptions)
  socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    });
  });

  // Handle mute & Unmute
  socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
    console.log("mute", userId);

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  socket.on(ACTIONS.UN_MUTE, ({ roomId, userId }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.UN_MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  // Leaving the room
  const leaveRoom = ({ roomId }) => {
    const { rooms } = socket;

    Array.from(rooms).forEach((roomId) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

      clients.forEach((clientId) => {
        // io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
        //   peerId: socket.id,
        //   userId: socketUserMapping[socket.id]?.id,
        // });

        io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
          peerId: socket.id,
          userId: socketUserMapping[socket.id]?.id,
        });

        socket.emit(ACTIONS.REMOVE_PEER, {
          peerId: clientId,
          userId: socketUserMapping[clientId]?.id,
        });
      });

      socket.leave(roomId);
    });

    delete socketUserMapping[socket.id];
  };

  socket.on(ACTIONS.LEAVE, leaveRoom);

  socket.on("disconnecting", leaveRoom);
});

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connnect"))
  .catch((err) => console.log(err.message));

server.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged Error ${err}`);
  server.close(() => process.exit(1));
});
