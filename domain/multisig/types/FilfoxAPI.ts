export interface Receipt {
  exitCode: number
}

export interface Message {
  cid: string
  height: number
  timestamp: number
  from: string
  to: string
  nonce: number
  value: string
  method: string
  receipt?: Receipt
  error?: string
  ethTransactionHash?: string
  eventLogs?: {
    data: string
    topics: string[]
  }[]
}

export interface GetProposeMessagesResponse {
  totalCount: number
  messages: Message[]
  methods: string[]
}
