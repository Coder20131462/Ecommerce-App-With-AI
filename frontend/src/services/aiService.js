import api from './api';

/**
 * Frontend service for the AI assistant endpoints.
 *
 * All calls go through the existing axios instance (api.js)
 * which handles CORS and session cookies automatically.
 */
export const aiService = {
  /**
   * Send a chat message and get the AI's response.
   *
   * @param {string} message         - The user's natural language input
   * @param {string} conversationId  - UUID kept in the ChatWidget for multi-turn memory
   * @returns {{ response: string, conversationId: string }}
   */
  chat: (message, conversationId) => {
    return api
      .post('/ai/chat', { message, conversationId })
      .then(res => res.data);
  },

  /**
   * Check if the AI assistant backend is online.
   * @returns {{ status: string, model: string }}
   */
  getStatus: () => {
    return api.get('/ai/status').then(res => res.data);
  }
};