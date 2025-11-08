import { z } from "zod";

// Create URL validation schema
export const createUrlSchema = z.object({
  originalUrl: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  customAlias: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9-_]+$/.test(val),
      "Custom alias can only contain letters, numbers, hyphens, and underscores"
    )
    .refine(
      (val) => !val || (val.length >= 3 && val.length <= 50),
      "Custom alias must be between 3 and 50 characters"
    ),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date > new Date();
      },
      "Expiration date must be in the future"
    ),
});

export type CreateUrlFormData = z.infer<typeof createUrlSchema>;
