import { z } from 'zod'

const productFields = {
  name: z.string().trim().min(2).max(180), description: z.string().min(10), shortDescription: z.string().max(240).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i), subcategoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  species: z.array(z.enum(['cat', 'dog', 'other'])).default([]), brand: z.string().trim().max(100).optional(),
  price: z.number().nonnegative(), discountPrice: z.number().nonnegative().optional(), stock: z.number().int().nonnegative(), sku: z.string().trim().max(80).optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().max(180).optional() })).max(8).default([]), tags: z.array(z.string().trim().max(40)).max(20).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
}

export const productInput = z.object(productFields).refine((data) => data.discountPrice === undefined || data.discountPrice <= data.price, { path: ['discountPrice'], message: 'Discount price cannot exceed regular price' })
export const productPatchInput = z.object(productFields).partial().refine((data) => data.discountPrice === undefined || data.price === undefined || data.discountPrice <= data.price, { path: ['discountPrice'], message: 'Discount price cannot exceed regular price' })

export const categoryInput = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/), description: z.string().max(500).optional(), image: z.string().url().optional(), parentId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), order: z.number().int().optional(), active: z.boolean().optional() })
