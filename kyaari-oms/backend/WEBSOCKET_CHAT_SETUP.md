# WebSocket Chat System for Tickets

## Overview
This document describes the WebSocket-based real-time chat system implemented for ticket communication between admins, vendors, accounts, and operations teams.

## Architecture

### Components

1. **TicketChatGateway** (`ticket-chat.gateway.ts`)
   - Handles all WebSocket connections
   - Manages room-based chat (one room per ticket)
   - Authenticates users via JWT tokens
   - Handles real-time message broadcasting

2. **TicketChatService** (`ticket-chat.service.ts`)
   - Database operations for chat messages
   - Access control validation
   - Message persistence

3. **REST API Endpoints** (`ticket-chat.controller.ts`)
   - Fallback REST endpoints for chat operations
   - File upload handling for attachments

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install socket.io@^4.7.2
```

### 2. Database Schema

The chat system uses the existing `TicketChat` model in the Prisma schema:

```prisma
model TicketChat {
  id          String      @id @default(cuid())
  ticketId    String
  senderId    String
  message     String?     @db.Text
  attachments Json?
  messageType MessageType @default(TEXT)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  ticket      Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  sender      User   @relation("SentTicketMessages", fields: [senderId], references: [id], onDelete: Restrict)

  @@index([ticketId, createdAt])
  @@index([senderId])
  @@map("ticket_chats")
}
```

### 3. Environment Variables

Ensure your `.env` includes CORS origins:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Usage

### Client-Side Connection

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_ACCESS_TOKEN'
  },
  transports: ['websocket', 'polling']
});

// Connection confirmation
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Join a ticket chat room
socket.emit('join_ticket', { ticketId: 'ticket-id-123' });

// Confirm joined
socket.on('joined_ticket', (data) => {
  console.log('Joined ticket:', data);
});

// Receive message history
socket.on('messages_history', (data) => {
  console.log('Message history:', data);
});

// Send a message
socket.emit('send_message', {
  ticketId: 'ticket-id-123',
  message: 'Hello!',
  messageType: 'TEXT'
}, (response) => {
  if (response.success) {
    console.log('Message sent');
  }
});

// Receive new messages
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
});

// Typing indicators
socket.emit('typing_start', { ticketId: 'ticket-id-123' });
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is typing...`);
});

socket.emit('typing_stop', { ticketId: 'ticket-id-123' });
socket.on('user_stopped_typing', (data) => {
  console.log(`${data.userName} stopped typing`);
});

// Leave ticket room
socket.emit('leave_ticket', { ticketId: 'ticket-id-123' });

// Error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Disconnect
socket.disconnect();
```

### REST API Endpoints (Fallback)

If WebSocket is unavailable, you can use REST endpoints:

- `GET /api/tickets/:ticketId/chat` - Get chat messages
- `POST /api/tickets/:ticketId/chat` - Send a message
- `GET /api/tickets/:ticketId/chat/participants` - Get participants
- `POST /api/tickets/:ticketId/chat/upload` - Upload file attachment

## WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_ticket` | `{ ticketId: string }` | Join a ticket chat room |
| `leave_ticket` | `{ ticketId: string }` | Leave a ticket chat room |
| `send_message` | `{ ticketId, message, messageType?, attachments? }` | Send a chat message |
| `typing_start` | `{ ticketId: string }` | User started typing |
| `typing_stop` | `{ ticketId: string }` | User stopped typing |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId, message }` | Connection confirmed |
| `joined_ticket` | `{ ticketId, message }` | Successfully joined ticket room |
| `left_ticket` | `{ ticketId, message }` | Left ticket room |
| `messages_history` | `{ messages, pagination }` | Message history loaded |
| `new_message` | `{ message, ticketId, timestamp }` | New message received |
| `user_joined` | `{ userId, ticketId, timestamp }` | User joined the room |
| `user_left` | `{ userId, ticketId, timestamp }` | User left the room |
| `user_typing` | `{ userId, userName, ticketId, timestamp }` | User is typing |
| `user_stopped_typing` | `{ userId, userName, ticketId, timestamp }` | User stopped typing |
| `error` | `{ type, message }` | Error occurred |

## Access Control

Users can access a ticket chat if they:
- Are an ADMIN (access to all tickets)
- Created the ticket
- Are assigned to the ticket
- Are the vendor associated with the ticket's GRN/dispatch
- Are an OPS team member who verified the related GRN
- Are an ACCOUNTS team member (for payment/invoice issues)

## Message Types

- `TEXT` - Plain text message (default)
- `FILE` - Document/file attachment
- `IMAGE` - Image attachment
- `SYSTEM` - System-generated message

## Features

1. **Real-time Messaging**: Instant message delivery via WebSocket
2. **Room Management**: Automatic room creation and cleanup
3. **Typing Indicators**: See when users are typing
4. **Message History**: Load previous messages on room join
5. **File Attachments**: Support for images and documents via S3
6. **User Presence**: Track active users in ticket rooms
7. **Access Control**: Secure access based on user roles and ticket relationships
8. **Error Handling**: Comprehensive error handling and logging

## Production Considerations

1. **Scaling**: For multiple server instances, use Redis adapter for Socket.IO:
   ```bash
   npm install @socket.io/redis-adapter
   ```

2. **Rate Limiting**: Implement rate limiting for message sending

3. **Message Persistence**: All messages are stored in the database

4. **Monitoring**: Monitor WebSocket connections and message throughput

5. **Security**: 
   - Always validate JWT tokens
   - Check user permissions before allowing room access
   - Sanitize user inputs

## Troubleshooting

### Connection Issues
- Verify JWT token is valid and not expired
- Check CORS configuration
- Ensure WebSocket server is running

### Access Denied
- Verify user has appropriate role/permissions
- Check ticket relationships (vendor, assignee, etc.)

### Messages Not Delivering
- Verify user is in the ticket room
- Check WebSocket connection status
- Review server logs for errors

