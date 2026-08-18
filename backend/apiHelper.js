import { getToken } from "./authServices";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";


export async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': `application/json`,
        ...(token ? { 'Authorization' : `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const res = await fetch(`${API_URL}${endpoint}`,
            {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
            }
        );
        
        const data = await res.json();
        
        if (!res.ok)
            throw new Error(data.error || `Request failed`);

        return { success: true, data }
    }
    catch (err) {
        return { success: false, error: err.message }
    }
}