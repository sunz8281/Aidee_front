import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
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

    if (
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/logout') ||
      original.url?.includes('/auth/me')
    ) {
      useAuthStore.getState().setLoggedIn(false)
      redirectToLogin()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => apiClient(original))
    }

    original._retry = true
    isRefreshing = true

    try {
      await apiClient.post('/auth/refresh')
      processQueue(null)
      return apiClient(original)
    } catch (refreshErr) {
      processQueue(refreshErr)
      useAuthStore.getState().setLoggedIn(false)
      redirectToLogin()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)
