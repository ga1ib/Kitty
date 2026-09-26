import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User, type UserRecord } from '../models/User.js'
import { SellerProfile } from '../models/Marketplace.js'
import { env } from '../config/env.js'
import { AppError, asyncHandler } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'
import { randomBytes } from 'node:crypto'

export const authRouter = Router()
const issueSession = (user: UserRecord & { id?: string }) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '2h' })
const sessionCookie = (res: import('express').Response, token: string) => res.cookie('accessToken', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000, path: '/' })
const registerSchema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.string().email().transform(v => v.toLowerCase()), phone: z.string().trim().min(6).max(30), password: z.string().min(10).max(100), role: z.enum(['BUYER', 'SELLER']).default('BUYER'), address: z.string().trim().optional(), country: z.string().trim().optional(), shopName: z.string().trim().min(2).max(100).optional(), shopDescription: z.string().max(2000).optional(), businessAddress: z.string().trim().optional(), city: z.string().trim().optional(), postalCode: z.string().trim().optional() }).superRefine((input, ctx) => {
  if (input.role === 'BUYER' && (!input.address || !input.city || !input.postalCode || !input.country)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Buyer address, city, postal code, and country are required', path: ['address'] })
  if (input.role === 'SELLER' && (!input.shopName || !input.businessAddress || !input.city || !input.postalCode)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Seller shop name and business address details are required', path: ['shopName'] })
})
const publicUser = (user: UserRecord & { id?: string; _id?: unknown }) => ({ id: String(user.id ?? user._id), firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role })

authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body)
  if (await User.exists({ email: input.email })) throw new AppError('An account with this email already exists', 409)
  if (input.role === 'SELLER' && !input.shopName) throw new AppError('Shop name is required for seller registration')
  const user = await User.create({ firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone, passwordHash: await bcrypt.hash(input.password, 12), role: input.role, address: input.role === 'BUYER' ? input.address : input.businessAddress, city: input.city, postalCode: input.postalCode, country: input.country })
  if (input.role === 'SELLER') {
    const shopSlug = `${input.shopName!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user.id.slice(-5)}`
    await SellerProfile.create({ userId: user.id, shopName: input.shopName, shopSlug, shopDescription: input.shopDescription || 'A little shop for very good pets.', businessAddress: input.businessAddress || 'To be completed', city: input.city || 'Dhaka', postalCode: input.postalCode || '0000' })
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '2h' })
  res.cookie('accessToken', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000, path: '/' })
  res.status(201).json({ success: true, message: 'Welcome to KITTY', data: { user: publicUser(user) } })
}))

authRouter.post('/login', asyncHandler(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body)
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash')
  if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError('Email or password is incorrect', 401)
  if (user.status !== 'ACTIVE') throw new AppError('This account is currently unavailable', 403)
  user.lastLoginAt = new Date(); await user.save()
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '2h' })
  res.cookie('accessToken', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000, path: '/' })
  res.json({ success: true, message: 'Signed in', data: { user: publicUser(user) } })
}))

authRouter.get('/google', (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return res.redirect(`${env.CLIENT_URL}/login?googleError=${encodeURIComponent('Google sign-in is not configured yet. Add the Google OAuth keys to the server environment.')}`)
  const state = randomBytes(24).toString('hex')
  res.cookie('googleOAuthState', state, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/api/v1/auth' })
  const callback = env.GOOGLE_CALLBACK_URL ?? `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString()
  res.redirect(url.toString())
})

authRouter.get('/google/callback', asyncHandler(async (req, res) => {
  const callback = env.GOOGLE_CALLBACK_URL ?? `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`
  const fail = (reason: string) => res.redirect(`${env.CLIENT_URL}/login?googleError=${encodeURIComponent(reason)}`)
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || typeof req.query.code !== 'string' || req.query.state !== req.cookies?.googleOAuthState) return fail('Google sign-in could not be verified')
  res.clearCookie('googleOAuthState', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1/auth' })
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: req.query.code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: 'authorization_code' }) })
  if (!tokenResponse.ok) return fail('Google sign-in could not be completed')
  const tokenData = await tokenResponse.json() as { access_token?: string }
  if (!tokenData.access_token) return fail('Google sign-in could not be completed')
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tokenData.access_token}` } })
  if (!profileResponse.ok) return fail('Could not read your Google profile')
  const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; given_name?: string; family_name?: string; picture?: string }
  if (!profile.sub || !profile.email || !profile.email_verified) return fail('A verified Google email is required')
  let user = await User.findOne({ email: profile.email.toLowerCase() }).select('+passwordHash')
  if (!user) user = await User.create({ firstName: profile.given_name || 'Pet', lastName: profile.family_name || 'Parent', email: profile.email.toLowerCase(), profileImage: profile.picture, role: 'BUYER', emailVerified: true })
  if (user.role === 'ADMIN') return fail('Use the configured administrator email and password to sign in')
  if (user.status !== 'ACTIVE') return fail('This account is currently unavailable')
  user.lastLoginAt = new Date(); await user.save()
  sessionCookie(res, issueSession(user))
  return res.redirect(`${env.CLIENT_URL}${user.role === 'SELLER' ? '/seller/dashboard' : '/account'}?google=success`)
}))

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('accessToken', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  res.json({ success: true, message: 'Signed out', data: null })
})

authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id).select('-passwordHash')
  const sellerProfile = req.user!.role === 'SELLER' ? await SellerProfile.findOne({ userId: req.user!.id }).select('shopName shopSlug status moderationReason') : null
  res.json({ success: true, message: 'Account loaded', data: { user, sellerProfile } })
}))
