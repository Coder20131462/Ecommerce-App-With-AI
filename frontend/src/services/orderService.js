import api from './api';

export const orderService = {
  createOrder: (orderData) => {
    return api.post('/orders', orderData).then(response => response.data);
  },

  getOrderById: (id) => {
    return api.get(`/orders/${id}`).then(response => response.data);
  },

  getOrdersByUserId: (userId) => {
    return api.get(`/orders/user/${userId}`).then(response => response.data);
  },

  getOrdersByUserIdPaginated: (userId, params = {}) => {
    const { page = 0, size = 10 } = params;
    return api.get(`/orders/user/${userId}/paginated?page=${page}&size=${size}`)
      .then(response => response.data);
  },

  updateOrderStatus: (id, status) => {
    return api.put(`/orders/${id}/status`, { status }).then(response => response.data);
  },

  updatePaymentStatus: (id, paymentIntentId, paymentStatus) => {
    return api.put(`/orders/${id}/payment`, { paymentIntentId, paymentStatus })
      .then(response => response.data);
  },

  getAllOrders: () => {
    return api.get('/orders').then(response => response.data);
  },

  getOrdersByStatus: (status) => {
    return api.get(`/orders/status/${status}`).then(response => response.data);
  }
}; 