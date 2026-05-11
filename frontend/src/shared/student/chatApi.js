import axios from 'axios';

const API_URL = 'http://localhost:3000/api/chat';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchConversations() {
  const res = await axios.get(`${API_URL}/conversations`, { headers: getAuthHeaders() });
  return res.data.conversations;
}

export async function fetchMessages(conversationId, page = 1, limit = 50) {
  const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
    params: { page, limit },
  });
  return res.data;
}

export async function sendMessage(conversationId, content, messageType = 'text') {
  const res = await axios.post(
    `${API_URL}/conversations/${conversationId}/messages`,
    { content, messageType },
    { headers: getAuthHeaders() }
  );
  return res.data.data;
}

export async function createConversation({ type, name, memberIds, eventId }) {
  const res = await axios.post(
    `${API_URL}/conversations`,
    { type, name, memberIds, eventId },
    { headers: getAuthHeaders() }
  );
  return res.data.conversation;
}

export async function markAsRead(conversationId) {
  await axios.put(`${API_URL}/conversations/${conversationId}/read`, {}, { headers: getAuthHeaders() });
}

export async function addMembers(conversationId, memberIds) {
  const res = await axios.post(
    `${API_URL}/conversations/${conversationId}/members`,
    { memberIds },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function removeMember(conversationId, userId) {
  const res = await axios.delete(
    `${API_URL}/conversations/${conversationId}/members/${userId}`,
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function fetchAllUsers() {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:3000/api/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.users || res.data;
}
