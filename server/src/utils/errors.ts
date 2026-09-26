import type { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  constructor(message: string, public statusCode = 400) { super(message); this.name = 'AppError' }
}

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next)

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  void next
  if (typeof error === 'object' && error !== null && 'issues' in error && Array.isArray(error.issues)) {
    res.status(400).json({ success: false, message: 'Request validation failed', errors: error.issues.map((issue: { path: Array<string | number>; message: string }) => ({ path: issue.path.join('.'), message: issue.message })) })
    return
  }
  const err = error instanceof Error ? error : new Error('Unexpected server error')
  const status = err instanceof AppError ? err.statusCode : 500
  if (status >= 500) console.error(err.message)
  res.status(status).json({ success: false, message: status === 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message, errors: [] })
}
