import { Schema, model, type InferSchemaType } from 'mongoose'

const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['BUYER', 'SELLER', 'ADMIN'], default: 'BUYER', required: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'], default: 'ACTIVE', index: true },
  profileImage: { type: String },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  addresses: [{ label: { type: String, enum: ['Home','Office','Other'], default: 'Home' }, fullName: String, phone: String, address: String, city: String, postalCode: String, country: String, isDefault: { type: Boolean, default: false } }],
  wishlist: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product' }, addedAt: { type: Date, default: Date.now } }],
}, { timestamps: true })
userSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'ADMIN' }, name: 'one_admin_account' })

export type Role = 'BUYER' | 'SELLER' | 'ADMIN'
export type UserRecord = InferSchemaType<typeof userSchema>
export const User = model('User', userSchema)
