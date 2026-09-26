import axios from 'axios'
import { apiBaseUrl } from './config'

const api = axios.create({ baseURL: apiBaseUrl, withCredentials: true })
export type AdminSection = 'Overview' | 'Sellers' | 'Products' | 'Orders' | 'Reports' | 'Categories' | 'Analytics' | 'Audit log' | 'Users' | 'Inbox' | 'Settings'
export async function adminGet<T>(section: AdminSection, q = '', page = 1): Promise<{ data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  const path: Record<AdminSection, string> = { Overview: '/admin/overview', Sellers: '/admin/sellers', Products: '/admin/products', Orders: '/admin/orders', Reports: '/admin/reports', Categories: '/admin/categories', Analytics: '/admin/analytics', 'Audit log': '/admin/audit-logs', Users: '/admin/users', Inbox: '/admin/inbox', Settings: '/admin/settings' }
  const response = await api.get(path[section], { params: { ...(q ? { q } : {}), page, limit: 20 } })
  return response.data as { data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } }
}
export async function adminAction(path: string, method: 'post' | 'patch' = 'patch', body?: unknown) {
  const response = await api[method](`/admin${path}`, body)
  return response.data.data as unknown
}
export function adminError(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : 'Request failed' }
