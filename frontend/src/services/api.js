import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  // States - Direct from API
  getStates: () => apiClient.get('/states'),

  // Districts - Direct from API
  getDistrictsByState: (stateName) => apiClient.get(`/districts/${encodeURIComponent(stateName)}`),

  // Performance - Direct from API
  getLatestPerformance: (districtName, stateName, financialYear) => 
    apiClient.get(`/performance/${encodeURIComponent(districtName)}`, { params: { state: stateName, fy: financialYear } }),
  getPerformanceHistory: (districtName, stateName, financialYear, limit = 12) =>
    apiClient.get(`/performance/${encodeURIComponent(districtName)}/history`, { params: { state: stateName, fy: financialYear, limit } }),
};

export default apiClient;
