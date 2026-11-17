/**
 * API client for the FastAPI Resume Chatbot backend
 */

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
const DIRECT_BACKEND = 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorDetail = 'Request failed';
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorDetail);
    }
    return await res.json();
  } catch (err) {
    // If request failed through proxy, attempt direct backend fallback if running on localhost
    if (API_BASE === '/api' && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      try {
        const directUrl = `${DIRECT_BACKEND}${endpoint}`;
        const directRes = await fetch(directUrl, config);
        if (directRes.ok) {
          return await directRes.json();
        }
      } catch {
        // Fall through to original error
      }
    }
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Resume data
  getResume: () => request('/resume'),

  // Conversations
  getConversations: () => request('/conversations'),
  createConversation: () => request('/conversations', { method: 'POST' }),
  getConversationHistory: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (conversationId, question) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        question: question.trim()
      })
    }),

  // Job Fit Evaluator
  evaluateJob: (conversationId, description) =>
    request(`/conversations/${conversationId}/job-description`, {
      method: 'POST',
      body: JSON.stringify({
        description: description.trim()
      })
    }),

  getFitReport: (conversationId) => request(`/conversations/${conversationId}/fit`)
};
