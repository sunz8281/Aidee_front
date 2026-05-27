import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentMessage } from '@/types'

interface AgentStore {
  isOpen: boolean
  isStreaming: boolean
  messages: AgentMessage[]
  inputText: string
  open: () => void
  close: () => void
  toggle: () => void
  setInputText: (text: string) => void
  addMessage: (msg: AgentMessage) => void
  appendToLastAssistant: (text: string) => void
  setStreaming: (v: boolean) => void
  clearMessages: () => void
}

export const useAgentStore = create<AgentStore>()(persist((set, get) => ({
  isOpen: false,
  isStreaming: false,
  messages: [],
  inputText: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
  setInputText: (text: string) => set({ inputText: text }),
  addMessage: (msg: AgentMessage) =>
    set(s => ({ messages: [...s.messages, msg] })),
  appendToLastAssistant: (text: string) =>
    set(s => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + text }
      } else {
        msgs.push({ role: 'assistant', content: text })
      }
      return { messages: msgs }
    }),
  setStreaming: (v: boolean) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
}), {
  name: 'agent-messages',
  partialize: state => ({ messages: state.messages }),
}))
