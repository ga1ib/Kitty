import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/kitty'),
  JWT_SECRET: z.string().min(24).default('development-secret-change-before-production'),
  ADMIN_EMAIL: z.string().email().default('admin@kitty.local'),
  ADMIN_PASSWORD: z.string().min(16).optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
})

export const env = schema.parse(process.env)

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'development-secret-change-before-production') {
  throw new Error('JWT_SECRET must be set to a unique secret in production')
}
if (env.NODE_ENV === 'production' && !env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD must be set in production')
}
