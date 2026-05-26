/**
 * API Service - Fixed version with proper error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('API connecting to:', API_BASE_URL);

class APIError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
};

const fetchWithToken = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers.Authorization = 'Token ' + token;
    
    const response = await fetch(API_BASE_URL + endpoint, { ...options, headers });
    
    if (!response.ok) {
      const data = await parseResponse(response);
      throw new APIError(data.detail || data.message || response.statusText || 'Error', response.status, data);
    }
    
    if (response.status === 204) return { success: true };
    return await response.json().catch(async () => ({ success: true }));
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const authAPI = {
  register: async (username, email, password) => {
    const response = await fetch(API_BASE_URL + '/users/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), email, password, password_confirm: password }),
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new APIError(data.detail || data.message || 'Registration failed', response.status, data);
    return data.user ? { token: data.token, ...data.user } : data;
  },
  
  registerAdmin: async (username, email, password, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Token ' + token;
    const response = await fetch(API_BASE_URL + '/setup/register-admin/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, email, password, password_confirm: password }),
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new APIError(data.detail || data.message || 'Admin registration failed', response.status, data);
    return data.user ? { token: data.token, ...data.user } : data;
  },
  
  login: async (username, password) => {
    const response = await fetch(API_BASE_URL + '/users/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new APIError(data.detail || data.message || 'Login failed', response.status, data);
    return data.user ? { token: data.token, ...data.user } : data;
  },
  
  getCurrentUser: () => fetchWithToken('/users/me/'),
  logout: () => fetchWithToken('/users/logout/', { method: 'POST' }),
  updateProfile: (data) => fetchWithToken('/users/update_profile/', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (oldPassword, newPassword) => fetchWithToken('/users/change_password/', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  }),
  requestPasswordReset: async (email) => {
    const response = await fetch(API_BASE_URL + '/users/request_password_reset/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new APIError(data.detail || data.message || 'Request failed', response.status, data);
    return data;
  },
};

const plantsAPI = {
  getAll: () => fetchWithToken('/plants/'),
  getById: (id) => fetchWithToken('/plants/' + id + '/'),
  create: (data) => fetchWithToken('/plants/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchWithToken('/plants/' + id + '/', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchWithToken('/plants/' + id + '/', { method: 'DELETE' }),
  water: (id) => fetchWithToken('/plants/' + id + '/water/', { method: 'POST' }),
};

const historyAPI = {
  getByPlantId: (id) => fetchWithToken('/plants/' + id + '/watering_history/'),
  getHistory: () => fetchWithToken('/watering-history/'),
  getAllPaginated: (page = 1, size = 20) => fetchWithToken('/watering_history/?page=' + page + '&page_size=' + size),
  getAllHistoryAdmin: async () => {
    try {
      return await fetchWithToken('/watering_history/admin/');
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        return await fetchWithToken('/watering-history/all_history/');
      }
      throw err;
    }
  },
  getStats: () => fetchWithToken('/watering_history/stats/'),
};

const adminAPI = {
  getAllUsers: () => fetchWithToken('/users/'),
  getUserById: (id) => fetchWithToken('/users/' + id + '/'),
  getAllPlants: () => fetchWithToken('/plants/'),
  deleteUser: (id) => fetchWithToken('/users/' + id + '/', { method: 'DELETE' }),
  resetUserPassword: (id, pass) => fetchWithToken('/users/' + id + '/reset_password/', {
    method: 'POST',
    body: JSON.stringify({ user_id: id, new_password: pass }),
  }),
  getAdminStats: () => fetchWithToken('/plants/admin_stats/'),
};

const iotAPI = {
  getTelemetry: (device_id = '', limit = 20) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (device_id) params.set('device_id', device_id);
    return fetchWithToken('/iot/telemetry/?' + params.toString());
  },
  getLatestTelemetry: (device_id) => {
    const params = new URLSearchParams({ limit: '1' });
    if (device_id) params.set('device_id', device_id);
    return fetchWithToken('/iot/telemetry/?' + params.toString());
  },
};

const apiService = { authAPI, plantsAPI, historyAPI, adminAPI, iotAPI };

export { authAPI, plantsAPI, historyAPI, adminAPI, iotAPI };
export default apiService;
