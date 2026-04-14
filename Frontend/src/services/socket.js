import socket, { connectSocket, disconnectSocket } from "../socket";

export { connectSocket };
export { disconnectSocket };

export const onMessage = (callback) => {
  socket.on("newMessage", callback);
};

export default socket;
