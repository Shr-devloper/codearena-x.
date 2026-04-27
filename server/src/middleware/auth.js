import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      const err = new Error("Authentication required");
      err.status = 401;
      return next(err);
    }
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      const err = new Error("Invalid or expired token");
      err.status = 401;
      return next(err);
    }
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      return next(err);
    }
    req.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
}

/**
 * Attaches `req.user` when a valid Bearer token is present; otherwise continues without user.
 */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return next();
    }
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (user) req.user = user;
    return next();
  } catch {
    return next();
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    const err = new Error("Admin only");
    err.status = 403;
    return next(err);
  }
  next();
}
