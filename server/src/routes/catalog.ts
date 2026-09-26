import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Category, Product, SellerProfile, AuditLog } from '../models/Marketplace.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { categoryInput, productInput, productPatchInput } from '../validators/catalog.js'
import { AppError, asyncHandler } from '../utils/errors.js'

export const catalogRouter = Router()
const pagination = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) })
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

catalogRouter.get('/categories', asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN' ? {} : { active: true }
  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean()
  res.json({ success: true, message: 'Categories loaded', data: categories })
}))

catalogRouter.post('/categories', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const input = categoryInput.parse(req.body)
  const category = await Category.create(input)
  res.status(201).json({ success: true, message: 'Category created', data: category })
}))
catalogRouter.patch('/categories/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const input = categoryInput.partial().parse(req.body)
  const category = await Category.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true })
  if (!category) throw new AppError('Category not found', 404)
  res.json({ success: true, message: 'Category updated', data: category })
}))

catalogRouter.get('/products', asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query)
  const filter: mongoose.FilterQuery<typeof Product> = { status: 'PUBLISHED' }
  if (typeof req.query.category === 'string' && mongoose.isValidObjectId(req.query.category)) filter.categoryId = req.query.category
  if (typeof req.query.seller === 'string' && mongoose.isValidObjectId(req.query.seller)) filter.sellerId = req.query.seller
  if (typeof req.query.species === 'string' && ['cat', 'dog', 'other'].includes(req.query.species)) filter.species = req.query.species
  const min = Number(req.query.minPrice), max = Number(req.query.maxPrice)
  if (Number.isFinite(min) || Number.isFinite(max)) filter.price = { ...(Number.isFinite(min) ? { $gte: min } : {}), ...(Number.isFinite(max) ? { $lte: max } : {}) }
  if (req.query.available === 'true') filter.$expr = { $gt: [{ $subtract: ['$stock', '$reservedStock'] }, 0] }
  if (typeof req.query.q === 'string' && req.query.q.trim()) filter.$text = { $search: req.query.q.trim() }
  const sortMap = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { ratingAverage: -1 }, popular: { salesCount: -1 } } as const
  const sortKey = typeof req.query.sort === 'string' && req.query.sort in sortMap ? req.query.sort as keyof typeof sortMap : 'newest'
  const [data, total] = await Promise.all([Product.find(filter).sort(sortMap[sortKey]).skip((page - 1) * limit).limit(limit).populate('categoryId', 'name slug').populate('sellerId', 'firstName lastName').lean(), Product.countDocuments(filter)])
  res.json({ success: true, message: 'Products loaded', data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}))

catalogRouter.get('/products/:slug', asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'PUBLISHED' }).populate('categoryId', 'name slug').populate('sellerId', 'firstName lastName')
  if (!product) throw new AppError('Product not found', 404)
  const seller = await SellerProfile.findOne({ userId: product.sellerId }).select('shopName shopSlug status ratingAverage reviewCount')
  res.json({ success: true, message: 'Product loaded', data: { product, seller } })
}))

catalogRouter.post('/products', authenticate, authorize('SELLER'), asyncHandler(async (req, res) => {
  const seller = await SellerProfile.findOne({ userId: req.user!.id })
  if (!seller || seller.status !== 'APPROVED') throw new AppError('Your seller account must be approved before listing products', 403)
  const input = productInput.parse(req.body)
  const category = await Category.findOne({ _id: input.categoryId, active: true })
  if (!category) throw new AppError('Choose an active category', 400)
  const baseSlug = slugify(input.name)
  const product = await Product.create({ ...input, sellerId: req.user!.id, slug: `${baseSlug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`, thumbnail: input.images[0]?.url, status: input.stock === 0 && input.status === 'PUBLISHED' ? 'DRAFT' : input.status })
  await AuditLog.create({ actorId: req.user!.id, actorRole: req.user!.role, action: 'SELLER_CREATED_PRODUCT', entityType: 'Product', entityId: product.id, ipAddress: req.ip })
  res.status(201).json({ success: true, message: 'Product created', data: product })
}))

catalogRouter.patch('/products/:id', authenticate, authorize('SELLER', 'ADMIN'), asyncHandler(async (req, res) => {
  const input = productPatchInput.parse(req.body)
  const filter: mongoose.FilterQuery<typeof Product> = { _id: req.params.id }
  if (req.user!.role === 'SELLER') filter.sellerId = req.user!.id
  const product = await Product.findOneAndUpdate(filter, input, { new: true, runValidators: true })
  if (!product) throw new AppError('Product not found or you do not own it', 404)
  await AuditLog.create({ actorId: req.user!.id, actorRole: req.user!.role, action: `${req.user!.role}_UPDATED_PRODUCT`, entityType: 'Product', entityId: product.id, ipAddress: req.ip })
  res.json({ success: true, message: 'Product updated', data: product })
}))

catalogRouter.delete('/products/:id', authenticate, authorize('SELLER', 'ADMIN'), asyncHandler(async (req, res) => {
  const filter: mongoose.FilterQuery<typeof Product> = { _id: req.params.id }
  if (req.user!.role === 'SELLER') filter.sellerId = req.user!.id
  const product = await Product.findOneAndUpdate(filter, { status: 'ARCHIVED' }, { new: true })
  if (!product) throw new AppError('Product not found or you do not own it', 404)
  await AuditLog.create({ actorId: req.user!.id, actorRole: req.user!.role, action: `${req.user!.role}_ARCHIVED_PRODUCT`, entityType: 'Product', entityId: product.id, ipAddress: req.ip })
  res.json({ success: true, message: 'Product archived', data: product })
}))

catalogRouter.get('/sellers/:slug', asyncHandler(async (req, res) => {
  const seller = await SellerProfile.findOne({ shopSlug: req.params.slug, status: 'APPROVED' }).populate('userId', 'firstName lastName')
  if (!seller) throw new AppError('Shop not found', 404)
  const { page, limit } = pagination.parse(req.query)
  const filter = { sellerId: seller.userId, status: 'PUBLISHED' }
  const [products, total] = await Promise.all([Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter)])
  res.json({ success: true, message: 'Shop loaded', data: { seller, products }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}))
