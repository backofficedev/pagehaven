import z from "zod";

/**
 * Shared validation schemas for auth forms
 */
export const emailSchema = z.email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters");

/**
 * Sign in form validation schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Sign up form validation schema
 */
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
