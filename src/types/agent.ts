export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentActionPayload {
  type: 'schedule_added' | 'schedule_updated' | 'schedule_deleted' | 'memo_updated'
  payload: Record<string, unknown>
}
