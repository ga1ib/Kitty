import { Schema, model } from 'mongoose'

const sellerProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  shopName: { type: String, required: true, trim: true }, shopSlug: { type: String, required: true, unique: true, index: true },
  shopDescription: { type: String, required: true, maxlength: 2000 }, shopLogo: String,
  businessAddress: { type: String, required: true }, city: { type: String, required: true }, postalCode: { type: String, required: true },
  businessInfo: String, status: { type: String, enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'], default: 'PENDING', index: true },
  ratingAverage: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 }, joinedAt: { type: Date, default: Date.now }, moderationReason: String,
}, { timestamps: true })

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, index: true },
  description: String, image: String, parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  active: { type: Boolean, default: true, index: true }, order: { type: Number, default: 0 },
}, { timestamps: true })

const productSchema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 180 }, slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true }, shortDescription: String,
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true }, subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  species: [{ type: String, enum: ['cat', 'dog', 'other'] }], brand: { type: String, trim: true, index: true },
  price: { type: Number, required: true, min: 0 }, discountPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 }, reservedStock: { type: Number, min: 0, default: 0 }, soldStock: { type: Number, min: 0, default: 0 }, sku: { type: String, sparse: true, unique: true },
  images: [{ url: String, alt: String }], thumbnail: String, specifications: { type: Map, of: String }, tags: [String], weight: Number, unit: String,
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'SUSPENDED', 'ARCHIVED'], default: 'DRAFT', index: true },
  ratingAverage: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 }, salesCount: { type: Number, default: 0 }, moderationReason: String,
}, { timestamps: true })
productSchema.index({ name: 'text', brand: 'text', tags: 'text', sku: 'text' })
productSchema.index({ categoryId: 1, status: 1, price: 1, ratingAverage: -1 })
productSchema.index({ sellerId: 1, status: 1, createdAt: -1 })

const petSchema = new Schema({ buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, name: { type: String, required: true }, species: { type: String, enum: ['cat', 'dog', 'other'], required: true }, breed: String, gender: String, dateOfBirth: Date, weight: Number, profileImage: String, allergies: [String], dietaryPreferences: [String], notes: String }, { timestamps: true })
const auditLogSchema = new Schema({ actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, actorRole: { type: String, required: true }, action: { type: String, required: true, index: true }, entityType: { type: String, required: true, index: true }, entityId: { type: Schema.Types.ObjectId, required: true, index: true }, metadata: { type: Schema.Types.Mixed }, ipAddress: String }, { timestamps: { createdAt: true, updatedAt: false } })
const orderItemSchema = new Schema({ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, name: { type: String, required: true }, slug: String, thumbnail: String, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true, min: 0 }, commissionAmount: { type: Number, required: true, min: 0 }, sellerNetAmount: { type: Number, required: true, min: 0 }, fulfillmentStatus: { type: String, enum: ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURNED'], default: 'PENDING' } })
const orderSchema = new Schema({ buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, orderNumber: { type: String, required: true, unique: true }, items: { type: [orderItemSchema], default: [] }, shippingAddress: { fullName: String, phone: String, address: String, city: String, postalCode: String, country: String, deliveryNotes: String }, deliveryFee: { type: Number, default: 0 }, subtotal: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURNED','REFUNDED'], default: 'PENDING', index: true }, paymentMethod: { type: String, enum: ['COD','ONLINE'], default: 'COD' }, paymentStatus: { type: String, enum: ['PENDING','PAID','FAILED','REFUNDED','CANCELLED'], default: 'PENDING' }, total: { type: Number, required: true, min: 0 }, createdAt: { type: Date, default: Date.now, index: true } }, { timestamps: true })
orderSchema.index({ buyerId: 1, createdAt: -1 })
orderSchema.index({ 'items.sellerId': 1, createdAt: -1 })
const cartSchema = new Schema({ buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }, items: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true, min: 1, default: 1 }, savedForLater: { type: Boolean, default: false } }] }, { timestamps: true })
const reviewSchema = new Schema({ buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true }, orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, rating: { type: Number, min: 1, max: 5, required: true }, title: { type: String, maxlength: 120 }, comment: { type: String, maxlength: 2000 }, sellerResponse: { type: String, maxlength: 1500 }, hidden: { type: Boolean, default: false } }, { timestamps: true })
reviewSchema.index({ buyerId: 1, productId: 1, orderId: 1 }, { unique: true })
const notificationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, required: true }, title: { type: String, required: true }, message: { type: String, required: true }, readAt: Date, entityId: Schema.Types.ObjectId }, { timestamps: true })
const reportSchema = new Schema({ reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, targetType: { type: String, enum: ['Product','Seller','Review'], required: true, index: true }, targetId: { type: Schema.Types.ObjectId, required: true, index: true }, reason: { type: String, required: true }, description: String, status: { type: String, enum: ['OPEN','UNDER_REVIEW','RESOLVED','DISMISSED'], default: 'OPEN', index: true }, adminNotes: String, resolvedAt: Date }, { timestamps: true })
const platformSettingsSchema = new Schema({ key: { type: String, default: 'platform', unique: true }, shopName: { type: String, default: 'KITTY' }, contactEmail: { type: String, default: 'hello@kitty.example' }, phone: { type: String, default: '' }, deliveryFee: { type: Number, default: 80, min: 0 }, commissionPercent: { type: Number, default: 10, min: 0, max: 100 } }, { timestamps: true })

export const SellerProfile = model('SellerProfile', sellerProfileSchema)
export const Category = model('Category', categorySchema)
export const Product = model('Product', productSchema)
export const Pet = model('Pet', petSchema)
export const AuditLog = model('AuditLog', auditLogSchema)
export const Order = model('Order', orderSchema)
export const Report = model('Report', reportSchema)
export const PlatformSettings = model('PlatformSettings', platformSettingsSchema)
export const Cart = model('Cart', cartSchema)
export const Review = model('Review', reviewSchema)
export const Notification = model('Notification', notificationSchema)
