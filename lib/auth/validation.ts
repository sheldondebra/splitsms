import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

export const phoneSchema = z
  .string()
  .min(10, "Enter a valid phone number")
  .max(20)
  .transform(normalizePhone);

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .transform((v) => v.toLowerCase());

const signupBaseSchema = z.object({
  fullName: z.string().min(2, "Name is too short").max(120),
  countryCode: z.string().min(2).max(10).toUpperCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
  signupMethod: z.enum(["phone", "email"]),
  referralCode: z.string().max(32).optional(),
});

export const phoneSignupSchema = signupBaseSchema
  .extend({
    signupMethod: z.literal("phone"),
    phone: z.string().min(8).max(20),
    email: z
      .string()
      .optional()
      .transform((v) => (v?.trim() ? v.trim().toLowerCase() : undefined)),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const emailSignupSchema = signupBaseSchema
  .extend({
    signupMethod: z.literal("email"),
    email: emailSchema,
    phone: z.string().min(8, "Phone required for SMS verification").max(20),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signupSchema = z.discriminatedUnion("signupMethod", [
  phoneSignupSchema,
  emailSignupSchema,
]);

export function normalizePhoneWithCountry(
  raw: string,
  dialCode: string,
  countryCode: string,
): string {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (trimmed.startsWith("+")) return normalizePhone(trimmed);
  if (trimmed.startsWith("00")) return normalizePhone(trimmed);
  const digits = trimmed.replace(/\D/g, "");
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  const code = dialCode.replace("+", "");
  if (local.startsWith(code)) return `+${local}`;
  if (countryCode === "GH" && digits.startsWith("233")) return `+${digits}`;
  return `${dialCode}${local}`;
}

export const phoneAuthSchema = z.object({
  phone: z.string().min(8, "Enter your phone number").max(20),
  countryCode: z.string().min(2).max(10).toUpperCase(),
  dialCode: z.string().min(2).max(6),
});

export const emailAuthLoginSchema = z.object({
  email: emailSchema,
});

export const emailAuthSignupSchema = z.object({
  email: emailSchema,
  phone: z.string().min(8, "Enter your phone number").max(20),
  countryCode: z.string().min(2).max(10).toUpperCase(),
  dialCode: z.string().min(2).max(6),
});

export const completeProfileSchema = z
  .object({
    fullName: z.string().min(2, "Name is too short").max(120),
    email: z
      .string()
      .optional()
      .transform((v) => (v?.trim() ? v.trim().toLowerCase() : undefined)),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3).max(120).transform((v) => v.trim()),
  password: z.string().min(1),
});

export const otpCodeSchema = z
  .string()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d{6}$/, "Code must be 6 digits");

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name is too short").max(120),
  email: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toLowerCase() : "")),
});

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\s/g, "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+233${digits.slice(1)}`;
  if (digits.length >= 9 && !digits.startsWith("+")) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
}
