import api from './api';

export const cartService = {
  getCart: (userId) => {
    return api.get(`/cart/${userId}`).then(response => response.data);
  },

  // Session-based endpoint (fallback)
  getCurrentUserCart: () => {
    return api.get('/cart/current').then(response => response.data);
  },

  addItemToCart: (userId, productId, quantity) => {
    return api.post(`/cart/${userId}/items`, { productId, quantity })
      .then(response => response.data);
  },

  // Session-based endpoint (fallback)
  addItemToCurrentUserCart: (productId, quantity) => {
    return api.post('/cart/current/items', { productId, quantity })
      .then(response => response.data);
  },

  updateCartItem: (userId, productId, quantity) => {
    return api.put(`/cart/${userId}/items/${productId}`, { quantity })
      .then(response => response.data);
  },

  removeItemFromCart: (userId, productId) => {
    return api.delete(`/cart/${userId}/items/${productId}`)
      .then(response => response.data);
  },

  clearCart: (userId) => {
    return api.delete(`/cart/${userId}`).then(response => response.data);
  }
}; 