import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CHAT_URL = `${API_BASE_URL}/chat`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchProfile() {
  const res = await axios.get(`${API_BASE_URL}/users/profile`, { headers: getAuthHeaders() });
  return res.data.user;
}

export async function searchChatUsers(query) {
  const res = await axios.get(`${CHAT_URL}/users/search`, {
    headers: getAuthHeaders(),
    params: { q: query },
  });
  return res.data.users || [];
}

export async function fetchConversations() {
  const res = await axios.get(`${CHAT_URL}/conversations`, { headers: getAuthHeaders() });
  return res.data.conversations || [];
}

export async function fetchMessages(conversationId, limit = 80) {
  const res = await axios.get(`${CHAT_URL}/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
    params: { limit },
  });
  return res.data.messages || [];
}

export async function createDirectConversation(identifier) {
  const res = await axios.post(`${CHAT_URL}/direct`, { identifier }, { headers: getAuthHeaders() });
  return res.data.conversation;
}

export async function createGroupConversation({ name, memberIds }) {
  const res = await axios.post(`${CHAT_URL}/groups`, { name, memberIds }, { headers: getAuthHeaders() });
  return res.data.conversation;
}

export async function sendMessage(conversationId, content) {
  const res = await axios.post(
    `${CHAT_URL}/conversations/${conversationId}/messages`,
    { content },
    { headers: getAuthHeaders() }
  );
  return res.data.data;
}

export async function uploadMessage(conversationId, formData) {
  // Let axios set Content-Type including multipart boundary
  const res = await axios.post(`${CHAT_URL}/conversations/${conversationId}/messages/upload`, formData, { headers: getAuthHeaders() });
  return res.data.data;
}

export async function markAsRead(conversationId) {
  await axios.put(`${CHAT_URL}/conversations/${conversationId}/read`, {}, { headers: getAuthHeaders() });
}

export async function addMembers(conversationId, memberIds) {
  const res = await axios.post(
    `${CHAT_URL}/conversations/${conversationId}/members`,
    { memberIds },
    { headers: getAuthHeaders() }
  );
  return res.data.conversation;
}

export async function inviteMember(conversationId, { identifier, message }) {
  const res = await axios.post(
    `${CHAT_URL}/conversations/${conversationId}/invitations`,
    { identifier, message },
    { headers: getAuthHeaders() }
  );
  return res.data.invitation;
}

export async function fetchInvitations() {
  const res = await axios.get(`${CHAT_URL}/invitations`, { headers: getAuthHeaders() });
  return res.data.invitations || [];
}

export async function respondInvitation(invitationId, action) {
  const res = await axios.patch(
    `${CHAT_URL}/invitations/${invitationId}`,
    { action },
    { headers: getAuthHeaders() }
  );
  return res.data.invitation;
}
