import axios from 'axios'
import { apiBaseUrl } from './config'

const authApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10000,
})

export type AccountRole = 'BUYER' | 'SELLER' | 'ADMIN'
export type AccountUser = { id: string; firstName: string; lastName: string; email: string; role: AccountRole; sellerProfile?: { shopName: string; shopSlug: string; status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'; moderationReason?: string } | null }
export type RegisterInput = {
  firstName: string; lastName: string; email: string; phone: string; password: string; role: 'BUYER' | 'SELLER';
  address?: string; city?: string; postalCode?: string; country?: string; shopName?: string; shopDescription?: string; businessAddress?: string
}

export async function getCurrentUser(): Promise<AccountUser | null> {
  try {
    const response = await authApi.get<{ data: { user: Omit<AccountUser, 'sellerProfile'>; sellerProfile?: AccountUser['sellerProfile'] } }>('/auth/me')
    return { ...response.data.data.user, sellerProfile: response.data.data.sellerProfile }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

export async function login(input: { email: string; password: string }): Promise<AccountUser> {
  const response = await authApi.post<{ data: { user: AccountUser } }>('/auth/login', input)
  return response.data.data.user
}

export async function register(input: RegisterInput): Promise<AccountUser> {
  const response = await authApi.post<{ data: { user: AccountUser } }>('/auth/register', input)
  return response.data.data.user
}

export async function logout(): Promise<void> {
  await authApi.post('/auth/logout')
}
