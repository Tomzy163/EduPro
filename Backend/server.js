import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import timetableRoutes from "./routes/timetable.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import { Server } from "socket.io";
// import { initSocket } from "./socket.js";
import http from "http";
import {
  registerSocketUser,
  setIo,
  unregisterSocketUser,
} from "./utils/socketState.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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
// initSocket(server);

// export { io, users };

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO`);
});
