import { Schema, model } from 'mongoose'

const newsletterSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  subscribedAt: { type: Date, default: Date.now },
}, { timestamps: true })

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ['NEW', 'READ', 'RESOLVED'], default: 'NEW', index: true },
}, { timestamps: true })

export const NewsletterSubscriber = model('NewsletterSubscriber', newsletterSchema)
export const ContactMessage = model('ContactMessage', contactMessageSchema)
