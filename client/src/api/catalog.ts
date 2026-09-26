import axios from 'axios'
import type { Product } from '../data'
import { apiBaseUrl } from './config'

const api = axios.create({ baseURL: apiBaseUrl, timeout: 8000 })

type CatalogProduct = {
  _id: string; slug: string; name: string; brand?: string; price: number; discountPrice?: number; ratingAverage?: number;
  reviewCount?: number; categoryId?: { name?: string } | string; species?: string[]; images?: Array<{ url: string; alt?: string }>;
  thumbnail?: string; status?: string; sellerId?: { firstName?: string; lastName?: string } | string
}

function mapProduct(item: CatalogProduct): Product {
  const categoryName = typeof item.categoryId === 'object' ? item.categoryId?.name || 'Pet supplies' : 'Pet supplies'
  const sellerName = typeof item.sellerId === 'object' ? `${item.sellerId.firstName || ''} ${item.sellerId.lastName || ''}`.trim() : 'Independent seller'
  const image = item.images?.[0]?.url || item.thumbnail || ''
  return {
    id: item.slug || item._id, name: item.name, brand: item.brand || 'Independent maker', price: item.discountPrice ?? item.price,
    oldPrice: item.discountPrice ? item.price : undefined, rating: item.ratingAverage || 0, reviews: item.reviewCount || 0,
    category: categoryName, kind: item.species?.length === 1 ? item.species[0] as Product['kind'] : 'both', image,
    badge: item.discountPrice ? 'On offer' : undefined, seller: sellerName,
  }
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<{ data: CatalogProduct[] }>('/products', { params: { limit: 40, sort: 'popular' } })
  return response.data.data.map(mapProduct)
}

export async function getCategories(): Promise<Array<{ _id: string; name: string; slug: string; image?: string; order: number }>> {
  const response = await api.get<{ data: Array<{ _id: string; name: string; slug: string; image?: string; order: number }> }>('/categories')
  return response.data.data
}
