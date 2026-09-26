import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User, type Role } from '../models/User.js'
import { AppError, asyncHandler } from '../utils/errors.js'

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken as string | undefined ?? req.header('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new AppError('Authentication required', 401)
  let payload: { sub: string; role: Role }
  try { payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: Role } } catch { throw new AppError('Invalid or expired token', 401) }
  const user = await User.findById(payload.sub).select('role status')
  if (!user || user.status !== 'ACTIVE') throw new AppError('Account unavailable', 401)
  req.user = { id: user.id, role: user.role }
  next()
})

export const authorize = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401))
  if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action', 403))
  next()
}
