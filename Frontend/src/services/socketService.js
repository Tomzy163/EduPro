import socket from "@/socket";

export const onMessage = (callback) => {
  socket.on("newMessage", callback);
};
