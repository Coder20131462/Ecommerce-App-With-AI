import api from './api';

export const authService = {
  getCurrentUser: () => {
    return api.get('/auth/user').then(response => response.data);
  },

  getUserById: (id) => {
    return api.get(`/auth/user/${id}`).then(response => response.data);
  },

  getUserByEmail: (email) => {
    return api.get(`/auth/user/email/${email}`).then(response => response.data);
  },

  updateUser: (id, userData) => {
    return api.put(`/auth/user/${id}`, userData).then(response => response.data);
  },

  loginWithGoogle: () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  },

  loginWithGithub: () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/github';
  },

  logout: () => {
    // Clear any stored tokens (for compatibility)
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // For session-based auth, we could call a logout endpoint
    // For now, we'll redirect to a logout URL or just resolve
    try {
      // Option 1: Call logout endpoint if it exists
      return api.post('/auth/logout').then(() => {
        // Optionally redirect to clear session completely
        window.location.href = '/';
      }).catch(() => {
        // If logout endpoint doesn't exist, just redirect
        window.location.href = '/';
      });
    } catch (error) {
      // Fallback: just redirect to clear session
      window.location.href = '/';
      return Promise.resolve();
    }
  }
}; 