/**
 * User validation schemas
 */
import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must be at most 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().min(1, "Tenant is required"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    tenantName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must be at most 100 characters"),
    tenantSlug: z
      .string()
      .min(3, "Subdomain must be at least 3 characters")
      .max(63, "Subdomain must be at most 63 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Subdomain must be lowercase alphanumeric with hyphens"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  email: emailSchema.optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  tenantSlug: z
    .string()
    .min(1, "Organization is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Invalid organization subdomain"
    ),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
