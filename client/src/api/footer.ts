import axios from 'axios'
import { apiBaseUrl } from './config'

const api = axios.create({ baseURL: apiBaseUrl, timeout: 8000 })

export async function subscribeToNewsletter(email: string): Promise<{ alreadySubscribed: boolean }> {
  const response = await api.post<{ data: { alreadySubscribed: boolean } }>('/newsletter', { email })
  return response.data.data
}

export async function sendContactMessage(input: { name: string; email: string; subject: string; message: string }): Promise<void> {
  await api.post('/contact', input)
}
