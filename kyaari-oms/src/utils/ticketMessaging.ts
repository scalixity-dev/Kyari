import { Socket } from 'socket.io-client'
import { TokenManager } from '../services/api'

export type SendTicketMessageParams = {
  ticketId: string
  messageText: string
  attachment: File | null
  socket: Socket | null | undefined
  onCleared?: () => void
}

export type SendTicketMessageResult = {
  success: boolean
  error?: string
}

export async function sendTicketMessage(params: SendTicketMessageParams): Promise<SendTicketMessageResult> {
  const { ticketId, messageText, attachment, socket, onCleared } = params

  try {
    // File upload path with Authorization
    if (attachment) {
      const token = TokenManager.getAccessToken() || ''
      const form = new FormData()
      form.append('file', attachment)
      const trimmed = messageText.trim()
      if (trimmed) form.append('message', trimmed)

      const resp = await fetch(`/api/tickets/${ticketId}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      if (!resp.ok) {
        return { success: false, error: `Upload failed (${resp.status})` }
      }

      if (onCleared) onCleared()
      return { success: true }
    }

    // Plain text socket message
    const trimmed = messageText.trim()
    if (!trimmed) return { success: false, error: 'Empty message' }
    if (!socket) return { success: false, error: 'Socket not connected' }

    socket.emit('send_message', {
      ticketId,
      message: trimmed,
      messageType: 'TEXT',
    })

    if (onCleared) onCleared()
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error: message }
  }
}


