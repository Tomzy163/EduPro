import AuditLog from "../models/AuditLog.js";

const getIpAddress = (req) =>
  String(
    req?.headers?.["x-forwarded-for"] ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      ""
  )
    .split(",")[0]
    .trim();

export const createAuditLog = async ({
  req,
  action,
  entityType = "system",
  entityId = "",
  status = "success",
  metadata = {},
  schoolId = null,
  userId = null,
  role = "",
}) => {
  try {
    await AuditLog.create({
      school: schoolId || req?.user?.school?._id || req?.user?.school || null,
      user: userId || req?.user?._id || null,
      role: role || req?.user?.role || "",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      status,
      ipAddress: getIpAddress(req),
      userAgent: String(req?.headers?.["user-agent"] || "").slice(0, 500),
      metadata,
    });
  } catch (error) {
    console.error("AUDIT_LOG_ERROR:", error.message);
  }
};
