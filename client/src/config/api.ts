// API configuration
// In production (Vercel), use the Render API URL
// In development, use local API or empty string for relative paths
const API_URL = import.meta.env.VITE_API_URL || 'https://tfbe-roadmap.onrender.com';

export default API_URL;

