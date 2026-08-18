import { apiRequest } from './apiHelper.js';

const TOKEN_KEY = 'authToken';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export async function loginUser(email, password) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (result.success) {
    setToken(result.data.jwtToken);
    return { success: true, user: result.data.user, token: result.data.jwtToken };
  }
  return result;
}

export async function logoutUser() {
  await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
  removeToken();
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', { method: 'GET' });
}

export async function registerUser(name, email, password, role) {
  return apiRequest('/Users', {
    method: 'POST',
    body: { name, email, password, role },
  });
}