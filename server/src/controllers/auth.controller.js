import * as authService from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validation/auth.js";

function zodToHttp(parsed) {
  if (parsed.success) return null;
  const first = parsed.error.issues[0];
  return first?.message || "Invalid input";
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    const msg = zodToHttp(parsed);
    if (msg) return res.status(400).json({ error: msg });
    const { user, token } = await authService.register(parsed.data);
    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    const msg = zodToHttp(parsed);
    if (msg) return res.status(400).json({ error: msg });
    const { user, token } = await authService.login(parsed.data);
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
