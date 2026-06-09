// lib/config.js

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
export const API_BASE = API_URL.replace(/\/api\/?$/, "") || "http://localhost:8080";
export const CURRENCY = import.meta.env.VITE_CURRENCY || "₹";
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Helper function for API calls
export const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    return response;
};