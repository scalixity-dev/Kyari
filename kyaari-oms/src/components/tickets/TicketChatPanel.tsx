import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, Eye, Image, FileText, Clock } from 'lucide-react'
import { TicketApi, type TicketChatMessage } from '../../services/ticketApi'
import { format } from 'date-fns'

interface TicketChatPanelProps {
  ticketId: string
  isOpen: boolean
  onClose: () => void
  ticketData?: {
    ticketNumber: string
    title: string
    status: string
    priority: string
  }
}

interface ChatParticipant {
  id: string
  name: string
  email: string
  role: string
  type: string
  companyName?: string
}

export default function TicketChatPanel({ ticketId, isOpen, onClose, ticketData }: TicketChatPanelProps) {
  const [messages, setMessages] = useState<TicketChatMessage[]>([])
  const [participants, setParticipants] = useState<ChatParticipant[]>([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<number | null>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Fetch initial data when panel opens
  useEffect(() => {
    if (isOpen && ticketId) {
      fetchChatData()
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [isOpen, ticketId])

  const startPolling = () => {
    stopPolling() // Clear any existing interval
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      if (isOpen && ticketId) {
        fetchMessages(false) // Fetch without loading state
      }
    }, 5000)
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const fetchChatData = async () => {
    try {
      setIsLoading(true)
      const [chatResponse, participantsResponse] = await Promise.all([
        TicketApi.getChatMessages(ticketId),
        TicketApi.getChatParticipants(ticketId)
      ])

      if (chatResponse.success) {
        setMessages(chatResponse.data.messages)
      }

      if (participantsResponse.success) {
        setParticipants(participantsResponse.data.participants)
      }
    } catch (error) {
      console.error('Error fetching chat data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      const response = await TicketApi.getChatMessages(ticketId)
      if (response.success) {
        setMessages(response.data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || isSending) return

    setIsSending(true)
    try {
      if (selectedFile) {
        // Upload file
        setIsUploading(true)
        const response = await TicketApi.uploadChatFile(ticketId, selectedFile, messageText.trim() || undefined)
        if (response.success) {
          setMessages(prev => [...prev, response.data.message])
          setMessageText('')
          setSelectedFile(null)
        }
      } else {
        // Send text message
        const response = await TicketApi.sendChatMessage(ticketId, messageText.trim())
        if (response.success) {
          setMessages(prev => [...prev, response.data.message])
          setMessageText('')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only images, PDFs, and documents are allowed.')
        return
      }

      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'VENDOR':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'OPS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ACCOUNTS':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMessageAlignment = (senderRole: string) => {
    // Different alignment based on role for better visual distinction
    switch (senderRole) {
      case 'VENDOR':
        return 'justify-start' // Left side
      case 'OPS':
        return 'justify-end' // Right side
      case 'ACCOUNTS':
        return 'justify-center' // Center
      default:
        return 'justify-start'
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="absolute bottom-0 sm:top-0 sm:right-0 h-[90vh] sm:h-full w-full sm:w-[600px] bg-white shadow-xl flex flex-col rounded-t-2xl sm:rounded-t-none">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex-shrink-0 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-gray-500">Ticket Chat</div>
              <div className="text-lg font-semibold text-gray-900">
                {ticketData?.ticketNumber || ticketId}
              </div>
              {ticketData?.title && (
                <div className="text-sm text-gray-600 mt-1">{ticketData.title}</div>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Participants</div>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <span
                    key={participant.id}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(participant.role)}`}
                  >
                    {participant.name}
                    {participant.companyName && ` (${participant.companyName})`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${getMessageAlignment(message.sender.role)}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                    message.sender.role === 'VENDOR' ? 'bg-blue-600 text-white' :
                    message.sender.role === 'OPS' ? 'bg-green-600 text-white' :
                    message.sender.role === 'ACCOUNTS' ? 'bg-purple-600 text-white' :
                    'bg-white text-gray-800 border'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      ['VENDOR', 'OPS', 'ACCOUNTS'].includes(message.sender.role) 
                        ? 'text-white/80' 
                        : 'text-gray-500'
                    }`}>
                      {message.sender.name} ({message.sender.role})
                      {message.sender.companyName && ` • ${message.sender.companyName}`}
                      <span className="ml-2">
                        {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    {message.message && (
                      <div className="text-sm leading-relaxed break-words">
                        {message.message}
                      </div>
                    )}

                    {/* File Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((file: any, index: number) => (
                          <div key={index} className={`p-2 rounded border ${
                            ['VENDOR', 'OPS', 'ACCOUNTS'].includes(message.sender.role)
                              ? 'bg-white/20 border-white/30'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.mimeType)}
                              <span className="text-sm font-medium flex-1 truncate">
                                {file.fileName}
                              </span>
                              <span className="text-xs opacity-75">
                                ({formatFileSize(file.fileSize)})
                              </span>
                              <button
                                onClick={() => window.open(file.url, '_blank')}
                                className="p-1 hover:bg-black/10 rounded"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {file.mimeType.startsWith('image/') && (
                              <img 
                                src={file.url} 
                                alt={file.fileName}
                                className="mt-2 max-w-full h-auto rounded max-h-48 object-contain"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="p-3 border-t bg-yellow-50">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.type)}
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({formatFileSize(selectedFile.size)})
              </span>
              <button
                onClick={removeSelectedFile}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              disabled={isSending || isUploading}
            />
            
            <button
              onClick={sendMessage}
              disabled={(!messageText.trim() && !selectedFile) || isSending || isUploading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              {isSending || isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}