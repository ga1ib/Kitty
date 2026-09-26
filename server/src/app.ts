import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { authRouter } from './routes/auth.js'
import { catalogRouter } from './routes/catalog.js'
import { errorHandler } from './utils/errors.js'
import { adminRouter } from './routes/admin.js'
import { buyerRouter, sellerRouter } from './routes/workspaces.js'
import { publicRouter } from './routes/public.js'

export const app = express()
app.disable('x-powered-by')
app.use(helmet())
const isAllowedOrigin = (origin: string | undefined) => {
  if (!origin || origin === env.CLIENT_URL) return true
  if (env.NODE_ENV !== 'development') return false
  try {
    const url = new URL(origin)
    return ['localhost', '127.0.0.1'].includes(url.hostname) && Number(url.port) >= 5173 && Number(url.port) <= 5199
  } catch { return false }
}
app.use(cors({ origin: (origin, callback) => callback(isAllowedOrigin(origin) ? null : new Error('Origin is not allowed'), origin), credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.get('/api/v1/health', (_req, res) => res.json({ success: true, message: 'KITTY API is healthy', data: { environment: env.NODE_ENV } }))
app.use('/api/v1/auth', authRouter)
app.use('/api/v1', publicRouter)
app.use('/api/v1', catalogRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/buyer', buyerRouter)
app.use('/api/v1/seller-workspace', sellerRouter)
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found', errors: [] }))
app.use(errorHandler)
