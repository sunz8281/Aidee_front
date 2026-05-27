import { create } from 'zustand'

interface TokenStore {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
}

export const useTokenStore = create<TokenStore>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}))
