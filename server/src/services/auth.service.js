import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/token.js";

export async function register({ email, password, name }) {
  const exists = await User.findOne({ email });
  if (exists) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, name, role: "user" });
  const token = signAccessToken(user._id.toString());
  return { user, token };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  user.lastActiveAt = new Date();
  await user.save();
  const token = signAccessToken(user._id.toString());
  return { user, token };
}

export async function upsertGoogleUser({ googleId, email, name, picture }) {
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = await User.create({
      email,
      googleId,
      name: name || email.split("@")[0],
      picture,
      role: "user",
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (picture) user.picture = picture;
    user.lastActiveAt = new Date();
    await user.save();
  }
  return user;
}
