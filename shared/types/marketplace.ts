export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN'
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
export type SellerStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'SUSPENDED' | 'ARCHIVED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED'

export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface ApiFailure { success: false; message: string; errors: Array<{ path?: string; message: string }> }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
