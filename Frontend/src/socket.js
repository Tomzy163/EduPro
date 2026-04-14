// frontend/src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

let currentUserId = null;

const registerCurrentUser = () => {
  if (socket.connected && currentUserId) {
    socket.emit("register", currentUserId);
  }
};

socket.on("connect", registerCurrentUser);

export const connectSocket = (userId) => {
  currentUserId = userId;

  if (!socket.connected) {
    socket.connect();
    return;
  }

  registerCurrentUser();
};

export const disconnectSocket = () => {
  currentUserId = null;
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
