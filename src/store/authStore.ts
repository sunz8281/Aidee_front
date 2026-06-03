import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  name: string
  pictureUrl: string
}

interface AuthStore {
  isLoggedIn: boolean
  user: AuthUser | null
  setLoggedIn: (v: boolean, user?: AuthUser) => void
}

export const useAuthStore = create<AuthStore>()(set => ({
  isLoggedIn: false,
  user: null,
  setLoggedIn: (v, user) => set({ isLoggedIn: v, user: user ?? null }),
}))
