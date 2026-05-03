import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

const JWT_ISSUER = env.jwtIssuer;
const JWT_AUDIENCE = env.jwtAudience;

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return jwt.verify(token, env.jwtSecret);
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token, unauthorized" });
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("school");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const requestSchoolId = String(
      req.headers["x-school-id"] || req.headers["x-schoolid"] || ""
    ).trim();
    const userSchoolId = String(user.school?._id || user.school || "").trim();

    if (!requestSchoolId) {
      return res.status(400).json({
        message: "x-school-id header is required on authenticated requests.",
      });
    }

    if (requestSchoolId !== userSchoolId) {
      return res.status(403).json({
        message: "Authenticated school context does not match the supplied school id.",
      });
    }

    // ✅ FIX: attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};
