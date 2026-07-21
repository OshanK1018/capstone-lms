const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3000/api"

const TOKEN_KEY = 'authToken';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export async function createUser(name, email, password, role) {
    try {
        const res = await fetch(`${API_URL}/Users`, 
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({name, email, password, role})
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }
            
            return data;
    }   
    catch(error) {
        console.error("Error adding student");
        return null;
    }
}

export async function loginUser(email, password) {
    try {
        const res = await fetch(
            `${API_URL}/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ email, password })
            }
        );
        const date = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Login failed");
        }

        setToken(data.jwtToken);

        return {
            success: true,
            user: data.user,
            token: data.jwtToken
        }

    } catch(error) {
        console.error("Error logging in", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function logoutUser() {
    fetch(`${API_URL}/auth/logout`, { method: 'POST' }).catch(console.error);
    removeToken();
}

export async function getCurrentUser() {
    const token = getToken();
    if (!token) {
        return {
            success: false,
            error: "No token found"
        }
    }

    try {
        const res = await fetch(
            `${API_URL}/auth/me`, 
            {
                headers: {
                    "Authorization" : `Bearer ${token}`
                }
            }
        );
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch current user");        
        }

        return {
            success: true,
            user: data.user
        }
    }
    catch(error) {
        console.log("getCurrentUser() error: ", error.message);
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            removeToken();
        }
        return {
            success: false,
            error: error.message
        }
    }
}