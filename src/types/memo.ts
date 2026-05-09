export interface Memo {
  meetingId: string
  meetingTitle: string
  memo: string
}

export interface MemosResponse {
  items: Memo[]
}
