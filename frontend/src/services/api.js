import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const fetchProducts = () => API.get('/products');
export const addProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const fetchDashboard = () => API.get('/inventory/dashboard');
export const createPO = (data) => API.post('/inventory/purchase-orders', data);

export default API;