// Global API helper - use this instead of hardcoded /api/ paths
import API_URL from '../config/api';

// Helper function to build API URLs
export const apiUrl = (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_URL}/${cleanPath}`;
};

// Helper for fetch with auth
export const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    return fetch(apiUrl(path), {
        ...options,
        headers,
    });
};

export default apiUrl;
