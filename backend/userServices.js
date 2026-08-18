import { getToken } from "./apiHelper.js";
import { apiRequest } from "./apiHelper.js";

export async function getUserById(userId) {
  return apiRequest(`/Users/${userId}`, { method: 'GET' });
}