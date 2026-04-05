import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

// Register user after login
export const connectSocket = (userId) => {
  if (userId) {
    socket.emit("register", userId);
  }
};

// Listen for messages
export const onMessage = (callback) => {
  socket.on("newMessage", callback);
};

export default socket;