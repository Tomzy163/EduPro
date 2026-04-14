import socket, { connectSocket } from "../socket";

export { connectSocket };

export const onMessage = (callback) => {
  socket.on("message", callback);
};

export default socket;
