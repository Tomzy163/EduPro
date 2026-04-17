import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDatabase from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import timetableRoutes from "./routes/timetable.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import {
  createDatabaseBackup,
  stopDatabaseBackupInterval,
} from "./utils/databaseBackup.js";
import {
  registerSocketUser,
  setIo,
  unregisterSocketUser,
} from "./utils/socketState.js";

dotenv.config();

const app = express();
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
  })
);
app.use(
  express.json({
    verify: (req, _res, buffer) => {
      if (buffer?.length) {
        req.rawBody = buffer.toString("utf8");
      }
    },
  })
);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/school", schoolRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
  },
});

app.set("io", io);
setIo(io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    if (!userId) return;

    registerSocketUser({ userId, socketId: socket.id });
  });

  socket.on("disconnect", () => {
    unregisterSocketUser(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (_req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
let shutdownInProgress = false;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using port ${PORT} or change PORT in backend/.env, then restart the server.`
    );
    process.exit(1);
  }

  if (error.code === "EACCES") {
    console.error(`Port ${PORT} requires elevated privileges.`);
    process.exit(1);
  }

  console.error("Failed to start server:", error);
  process.exit(1);
});

const shutdown = async (signal) => {
  if (shutdownInProgress) {
    return;
  }

  shutdownInProgress = true;
  console.log(`${signal} received. Backing up database and shutting down.`);

  try {
    await createDatabaseBackup({
      reason: `shutdown-${String(signal || "signal").toLowerCase()}`,
    });
  } catch (error) {
    console.error("Failed to write the shutdown backup:", error.message);
  } finally {
    stopDatabaseBackupInterval();
  }

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
};

const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} with Socket.IO`);
    });
  } catch (error) {
    console.error("Unable to initialize the server:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

startServer();
