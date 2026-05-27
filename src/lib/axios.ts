import axios from 'axios'
import { useTokenStore } from '@/store/tokenStore'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useTokenStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/logout')) {
      useTokenStore.getState().setAccessToken(null)
      redirectToLogin()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const res = await apiClient.post<{ access_token: string }>('/auth/refresh')
      const newToken = res.data.access_token
      useTokenStore.getState().setAccessToken(newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      processQueue(null, newToken)
      return apiClient(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      useTokenStore.getState().setAccessToken(null)
      redirectToLogin()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)
