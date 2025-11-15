import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Get Clerk session token
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API calls
export const userAPI = {
  signInOrSignUp: async (userData) => {
    const response = await api.post('/users/auth/signin-signup', userData);
    return response.data;
  },
  
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateUserProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

// Gig API calls
export const gigAPI = {
  getAllGigs: async () => {
    const response = await api.get('/gigs');
    return response.data;
  },
  
  getGigById: async (id) => {
    const response = await api.get(`/gigs/${id}`);
    return response.data;
  },
  
  createGig: async (gigData) => {
    const response = await api.post('/gigs', gigData);
    return response.data;
  },
  
  updateGig: async (id, gigData) => {
    const response = await api.put(`/gigs/${id}`, gigData);
    return response.data;
  },
  
  deleteGig: async (id) => {
    const response = await api.delete(`/gigs/${id}`);
    return response.data;
  },
  
  acceptGig: async (id) => {
    const response = await api.post(`/gigs/${id}/accept`);
    return response.data;
  },
  
  completeGig: async (id) => {
    const response = await api.post(`/gigs/${id}/complete`);
    return response.data;
  },
  
  getMyGigs: async () => {
    const response = await api.get('/gigs/my/gigs');
    return response.data;
  },
  
  getAcceptedGigs: async () => {
    const response = await api.get('/gigs/my/accepted');
    return response.data;
  },
};

// Product API calls
export const productAPI = {
  getAllProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  placeBid: async (id, bidAmount) => {
    const response = await api.post(`/products/${id}/bid`, { bidAmount });
    return response.data;
  },
  
  buyProduct: async (id) => {
    const response = await api.post(`/products/${id}/buy`);
    return response.data;
  },
  
  getMyProducts: async () => {
    const response = await api.get('/products/my/products');
    return response.data;
  },
};

export default api;
