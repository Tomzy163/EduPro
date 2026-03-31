// frontend/src/socket.js
import { io } from "socket.io-client";

// Connect to your backend Socket.IO server
const socket = io("http://localhost:5000");

// Optional: log when connected
socket.on("connect", () => {
  console.log("Connected to backend Socket.IO:", socket.id);
});

export default socket;