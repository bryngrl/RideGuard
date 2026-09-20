// for more information, see: https://zod.dev/packages/zod
import * as z from "zod";

const envSchema = z.object({
  FIREBASE_PROJECT_ID: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/),

  FIREBASE_APP_ID: z.string().trim().min(1),

  FIREBASE_API_KEY: z.string().trim().min(1).startsWith("AIza"),

  FIREBASE_AUTH_DOMAIN: z.hostname(),

  FIREBASE_STORAGE_BUCKET: z.hostname(),

  FIREBASE_MESSAGING_SENDER_ID: z.string().trim().regex(/^\d+$/),

  GOOGLE_WEB_CLIENT_ID: z
    .string()
    .trim()
    .endsWith(".apps.googleusercontent.com"),

  GOOGLE_ANDROID_CLIENT_ID: z
    .string()
    .trim()
    .endsWith(".apps.googleusercontent.com"),

  API_BASE_URL: z
    .url({
      protocol: /^https?$/,
    })
    .transform((url) => url.replace(/\/+$/, "")),
});

const result = envSchema.safeParse({
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,

  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
});

if (!result.success) {
  throw new Error(
    `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
