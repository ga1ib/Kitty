import axios from 'axios'
import { apiBaseUrl } from './config'
const api = axios.create({ baseURL: apiBaseUrl, withCredentials: true, timeout: 12000 })
export type RecordRow = Record<string, unknown> & { _id: string; id?: string; status?: string }
export type PageResult<T> = { data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } }
async function get<T>(path: string): Promise<T> { return (await api.get<{data:T}>(path)).data.data }
async function send<T>(method:'post'|'patch'|'delete',path:string,body?:unknown):Promise<T>{return (await api[method]<{data:T}>(path,body)).data.data}
export const buyerApi={
 profile:()=>get<RecordRow>('/buyer/profile'),saveProfile:(body:unknown)=>send<RecordRow>('patch','/buyer/profile',body),
 pets:()=>get<RecordRow[]>('/buyer/pets'),addPet:(body:unknown)=>send<RecordRow>('post','/buyer/pets',body),editPet:(id:string,body:unknown)=>send<RecordRow>('patch',`/buyer/pets/${id}`,body),deletePet:(id:string)=>send<null>('delete',`/buyer/pets/${id}`),
 addresses:()=>get<RecordRow[]>('/buyer/addresses'),addAddress:(body:unknown)=>send<RecordRow>('post','/buyer/addresses',body),editAddress:(id:string,body:unknown)=>send<RecordRow>('patch',`/buyer/addresses/${id}`,body),deleteAddress:(id:string)=>send<null>('delete',`/buyer/addresses/${id}`),
 wishlist:()=>get<RecordRow[]>('/buyer/wishlist'),addWish:(id:string)=>send<null>('post',`/buyer/wishlist/${id}`),deleteWish:(id:string)=>send<null>('delete',`/buyer/wishlist/${id}`),
 cart:()=>get<RecordRow>('/buyer/cart'),addCart:(productId:string,quantity=1)=>send<RecordRow>('post','/buyer/cart/items',{productId,quantity}),setCartQuantity:(productId:string,quantity:number)=>send<RecordRow>('patch',`/buyer/cart/items/${productId}`,{quantity}),removeCart:(id:string)=>send<RecordRow>('delete',`/buyer/cart/items/${id}`),saveCartForLater:(id:string,savedForLater:boolean)=>send<RecordRow>('patch',`/buyer/cart/items/${id}/saved`,{savedForLater}),
 orders:()=>get<RecordRow[]>('/buyer/orders'),placeOrder:(body:unknown)=>send<RecordRow>('post','/buyer/orders',body),cancelOrder:(id:string)=>send<RecordRow>('patch',`/buyer/orders/${id}/cancel`,{}),returnOrder:(id:string)=>send<RecordRow>('patch',`/buyer/orders/${id}/return`,{}),
 reviews:()=>get<RecordRow[]>('/buyer/reviews'),addReview:(body:unknown)=>send<RecordRow>('post','/buyer/reviews',body),editReview:(id:string,body:unknown)=>send<RecordRow>('patch',`/buyer/reviews/${id}`,body),deleteReview:(id:string)=>send<null>('delete',`/buyer/reviews/${id}`),notifications:()=>get<RecordRow[]>('/buyer/notifications'),readNotifications:()=>send<null>('patch','/buyer/notifications/read-all',{}),
}
export const sellerApi={
 profile:()=>get<RecordRow>('/seller-workspace/profile'),saveProfile:(body:unknown)=>send<RecordRow>('patch','/seller-workspace/profile',body),
 products:()=>get<RecordRow[]>('/seller-workspace/products'),addProduct:(body:unknown)=>send<RecordRow>('post','/seller-workspace/products',body),editProduct:(id:string,body:unknown)=>send<RecordRow>('patch',`/seller-workspace/products/${id}`,body),deleteProduct:(id:string)=>send<null>('delete',`/seller-workspace/products/${id}`),
 orders:()=>get<RecordRow[]>('/seller-workspace/orders'),setOrderStatus:(orderId:string,itemId:string,status:string)=>send<RecordRow>('patch',`/seller-workspace/orders/${orderId}/items/${itemId}/status`,{status}),
 reviews:()=>get<RecordRow[]>('/seller-workspace/reviews'),respondReview:(id:string,response:string)=>send<RecordRow>('patch',`/seller-workspace/reviews/${id}/response`,{response}),analytics:()=>get<RecordRow>('/seller-workspace/analytics'),notifications:()=>get<RecordRow[]>('/seller-workspace/notifications'),readNotifications:()=>send<null>('patch','/seller-workspace/notifications/read-all',{}),
}
export async function getWorkspaceCategories(){return (await api.get<{data:RecordRow[]}>('/categories')).data.data}
export function workspaceError(error:unknown){return axios.isAxiosError(error)?error.response?.data?.message??error.message:'Something went wrong. Please try again.'}
