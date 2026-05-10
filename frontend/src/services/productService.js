import api from './api';

export const productService = {
  getAllProducts: (params = {}) => {
    const { page = 0, size = 12, sortBy = 'id', sortDir = 'asc' } = params;
    return api.get(`/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`)
      .then(response => response.data);
  },

  getProductById: (id) => {
    return api.get(`/products/${id}`).then(response => response.data);
  },

  searchProducts: (keyword, params = {}) => {
    const { page = 0, size = 12 } = params;
    return api.get(`/products/search?keyword=${keyword}&page=${page}&size=${size}`)
      .then(response => response.data);
  },

  getProductsByCategory: (category) => {
    return api.get(`/products/category/${category}`).then(response => response.data);
  },

  getProductsByBrand: (brand) => {
    return api.get(`/products/brand/${brand}`).then(response => response.data);
  },

  getCategories: () => {
    return api.get('/products/categories').then(response => response.data);
  },

  getBrands: () => {
    return api.get('/products/brands').then(response => response.data);
  },

  getAvailableProducts: () => {
    return api.get('/products/available').then(response => response.data);
  },

  createProduct: (productData) => {
    return api.post('/products', productData).then(response => response.data);
  },

  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData).then(response => response.data);
  },

  deleteProduct: (id) => {
    return api.delete(`/products/${id}`).then(response => response.data);
  }
}; 