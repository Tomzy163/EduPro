import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
import connectDatabase from "./config/database.js";
import { env, validateEnv } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
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
  allowedOrigins,
  securityHeaders,
} from "./middleware/securityMiddleware.js";
import { sanitizeRequestPayload } from "./middleware/requestSanitizer.js";
import { createRateLimiter } from "./middleware/rateLimitMiddleware.js";
import {
  registerSocketUser,
  setIo,
  unregisterSocketUser,
} from "./utils/socketState.js";

const envValidation = validateEnv();
envValidation.warnings.forEach((warning) => {
  console.log(`ENV WARNING: ${warning}`);
});

const app = express();
const globalRateLimiter = createRateLimiter({
  keyPrefix: "global-api",
  windowMs: 15 * 60 * 1000,
  max: 800,
  message: "Too many requests from this device. Please slow down and try again shortly.",
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);
app.use(globalRateLimiter);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-paystack-signature",
      "x-school-id",
    ],
  })
);
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      if (buffer?.length) {
        req.rawBody = buffer.toString("utf8");
      }
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(sanitizeRequestPayload);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/school", schoolRoutes);
app.use((error, _req, res, _next) => {
  if (!error) {
    return res.status(500).json({ message: "Unexpected server error." });
  }

  if (
    error.message === "Only images or PDF allowed" ||
    error.message === "Only image files are allowed for the school logo"
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ message: error.message });
  }

  if (error.name === "MulterError") {
    return res.status(400).json({ message: error.message });
  }

  console.error("SERVER ERROR:", error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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

const PORT = env.port;
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
