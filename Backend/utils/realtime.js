import User from "../models/User.js";
import { io, users } from "./socketState.js";

export const emitToUserIds = ({ userIds = [], event, payload }) => {
  if (!event || !Array.isArray(userIds) || userIds.length === 0) return;

  const uniqueIds = [...new Set(userIds.map((id) => id?.toString()).filter(Boolean))];

  uniqueIds.forEach((userId) => {
    const activeConnections = users.filter(
      (user) => user.userId?.toString() === userId
    );

    activeConnections.forEach(({ socketId }) => {
      io.to(socketId).emit(event, payload);
    });
  });
};

export const emitSchoolAdminUpdate = async ({
  schoolId,
  roles = ["teacher", "student", "parent"],
  entity,
  action,
  message,
}) => {
  if (!schoolId) return;

  const recipients = await User.find({
    school: schoolId,
    role: { $in: roles },
  }).select("_id");

  recipients.forEach((recipient) => {
    const activeConnections = users.filter(
      (user) => user.userId?.toString() === recipient._id.toString()
    );

    activeConnections.forEach(({ socketId }) => {
      io.to(socketId).emit("admin:update", {
        entity,
        action,
        message,
        timestamp: new Date().toISOString(),
      });
    });
  });
};

export const emitAcademicUpdate = async ({
  schoolId,
  studentIds = [],
  entity,
  action,
  message,
}) => {
  if (!schoolId || studentIds.length === 0) return;

  const parents = await User.find({
    school: schoolId,
    role: "parent",
    children: { $in: studentIds },
  }).select("_id");

  emitToUserIds({
    userIds: [...studentIds, ...parents.map((parent) => parent._id)],
    event: "academic:update",
    payload: {
      entity,
      action,
      message,
      timestamp: new Date().toISOString(),
    },
  });
};
