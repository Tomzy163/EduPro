export let io = null;
export const users = [];

export const setIo = (nextIo) => {
  io = nextIo;
};

export const registerSocketUser = ({ userId, socketId }) => {
  const nextUsers = users.filter((user) => user.socketId !== socketId);
  users.splice(0, users.length, ...nextUsers, { userId, socketId });
};

export const unregisterSocketUser = (socketId) => {
  const nextUsers = users.filter((user) => user.socketId !== socketId);
  users.splice(0, users.length, ...nextUsers);
};
