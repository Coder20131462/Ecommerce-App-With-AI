import api from './api';

export const paymentService = {
  createPaymentIntent: (orderId) => {
    return api.post('/payments/create-payment-intent', { orderId })
      .then(response => response.data);
  },

  confirmPayment: (paymentIntentId) => {
    return api.post('/payments/confirm-payment', { paymentIntentId })
      .then(response => response.data);
  },

  getPaymentIntent: (paymentIntentId) => {
    return api.get(`/payments/payment-intent/${paymentIntentId}`)
      .then(response => response.data);
  }
}; 