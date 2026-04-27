import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(3, "Email is too short")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .transform((s) => s.toLowerCase());

const password = z
  .string()
  .min(8, "Use at least 8 characters for your password")
  .max(256, "Password is too long");

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const registerSchema = z.object({
  email,
  password,
  name,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(256),
});
