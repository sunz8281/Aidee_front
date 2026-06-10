import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentMessage } from '@/types'

interface AgentStore {
  isOpen: boolean
  isStreaming: boolean
  messagesByProject: Record<string, AgentMessage[]>
  inputText: string
  open: () => void
  close: () => void
  toggle: () => void
  setInputText: (text: string) => void
  addMessage: (projectId: string, msg: AgentMessage) => void
  appendToLastAssistant: (projectId: string, text: string) => void
  setStreaming: (v: boolean) => void
  clearMessages: (projectId: string) => void
  removeLastMessage: (projectId: string) => void
}

export const useAgentStore = create<AgentStore>()(persist((set) => ({
  isOpen: false,
  isStreaming: false,
  messagesByProject: {},
  inputText: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
  setInputText: (text: string) => set({ inputText: text }),
  addMessage: (projectId: string, msg: AgentMessage) =>
    set(s => ({
      messagesByProject: {
        ...s.messagesByProject,
        [projectId]: [...(s.messagesByProject[projectId] ?? []), msg],
      },
    })),
  appendToLastAssistant: (projectId: string, text: string) =>
    set(s => {
      const msgs = [...(s.messagesByProject[projectId] ?? [])]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + text }
      } else {
        msgs.push({ role: 'assistant', content: text })
      }
      return {
        messagesByProject: {
          ...s.messagesByProject,
          [projectId]: msgs,
        },
      }
    }),
  setStreaming: (v: boolean) => set({ isStreaming: v }),
  clearMessages: (projectId: string) =>
    set(s => ({
      messagesByProject: {
        ...s.messagesByProject,
        [projectId]: [],
      },
    })),
  removeLastMessage: (projectId: string) =>
    set(s => {
      const msgs = s.messagesByProject[projectId] ?? []
      return {
        messagesByProject: {
          ...s.messagesByProject,
          [projectId]: msgs.slice(0, -1),
        },
      }
    }),
}), {
  name: 'agent-messages',
  partialize: state => ({ messagesByProject: state.messagesByProject }),
}))
