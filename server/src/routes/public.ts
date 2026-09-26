import { Router } from 'express'
import { z } from 'zod'
import { ContactMessage, NewsletterSubscriber } from '../models/Communications.js'
import { asyncHandler } from '../utils/errors.js'

export const publicRouter = Router()

publicRouter.post('/newsletter', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().trim().email().max(254) }).parse(req.body)
  const normalizedEmail = email.toLowerCase()
  const existing = await NewsletterSubscriber.exists({ email: normalizedEmail })
  if (existing) {
    res.json({ success: true, message: 'This email is already subscribed', data: { subscribed: true, alreadySubscribed: true } })
    return
  }
  try {
    await NewsletterSubscriber.create({ email: normalizedEmail })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      res.json({ success: true, message: 'This email is already subscribed', data: { subscribed: true, alreadySubscribed: true } })
      return
    }
    throw error
  }
  res.status(201).json({ success: true, message: 'You are subscribed to the Kitty newsletter', data: { subscribed: true, alreadySubscribed: false } })
}))

publicRouter.post('/contact', asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(4000),
  }).strict().parse(req.body)
  const contact = await ContactMessage.create({ ...input, email: input.email.toLowerCase() })
  res.status(201).json({ success: true, message: 'Your message has been sent to Kitty support', data: { id: contact.id } })
}))
