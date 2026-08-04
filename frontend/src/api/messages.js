import { mapApiProduct } from './products'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const AUTH_KEY = 'secondloop_user'
const TOKEN_KEY = 'secondloop_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getUser() {
  const user = localStorage.getItem(AUTH_KEY)
  return user ? JSON.parse(user) : null
}

function getHeaders() {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

function formatMessageTime(dateValue) {
  if (!dateValue) {
    return 'Now'
  }

  return new Date(dateValue).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function mapApiConversation(conversation) {
  const user = getUser()
  const product = mapApiProduct(conversation.product)
  const otherUser =
    conversation.buyer_id === user?.id ? conversation.seller : conversation.buyer
  const messages = (conversation.messages || []).map((message) => ({
    id: `api-message-${message.id}`,
    apiId: message.id,
    sender: message.sender_id === user?.id ? 'me' : 'seller',
    text: message.body,
    time: formatMessageTime(message.created_at),
  }))
  const lastMessage = messages.at(-1)

  return {
    id: `api-conversation-${conversation.id}`,
    apiId: conversation.id,
    lastMessage: lastMessage?.text || `Conversation about ${product.title}`,
    messages,
    product,
    seller: otherUser?.name || product.seller,
    time: formatMessageTime(conversation.updated_at),
    unread: Number(conversation.unread_count || 0),
  }
}

export async function getConversations() {
  const token = getToken()

  if (!token) {
    return []
  }

  const response = await fetch(`${API_URL}/conversations`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not load messages')
  }

  return (data.conversations || []).map(mapApiConversation)
}

export async function startConversation(productId, message) {
  const response = await fetch(`${API_URL}/products/${productId}/conversations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not start conversation')
  }

  return mapApiConversation(data.conversation)
}

export async function sendConversationMessage(conversationId, message) {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not send message')
  }

  return mapApiConversation(data.conversation)
}

export async function markConversationRead(conversationId) {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: getHeaders(),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not mark conversation as read')
  }

  return mapApiConversation(data.conversation)
}
