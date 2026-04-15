const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
    async signup(userData) {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Signup failed');
        }
        return res.json();
    },

    async login(credentials) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }
        return res.json();
    },

    async googleLogin(token) {
        const res = await fetch(`${API_URL}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Google login failed');
        }
        return res.json();
    },

    async loginMfa(email, token) {
        const res = await fetch(`${API_URL}/login/mfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'MFA validation failed');
        }
        return res.json();
    },

    async setupMfa(email) {
        const res = await fetch(`${API_URL}/mfa/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Failed to setup MFA');
        return res.json();
    },

    async verifyMfa(email, secret, token) {
        const res = await fetch(`${API_URL}/mfa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, secret, token })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to verify MFA');
        }
        return res.json();
    },

    async getTasks(userEmail) {
        const res = await fetch(`${API_URL}/tasks?user=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
    },

    async addTask(taskData) {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!res.ok) throw new Error('Failed to add task');
        return res.json();
    },

    async updateTask(taskId, updates) {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update task');
        return res.json();
    },

    async deleteTask(taskId) {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete task');
        return res.json();
    },

    async createOrder(data) {
        const res = await fetch(`${API_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
    },

    async verifyPayment(paymentData) {
        const res = await fetch(`${API_URL}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        if (!res.ok) throw new Error('Failed to verify payment');
        return res.json();
    },

    async getUserPurchases(userEmail) {
        const res = await fetch(`${API_URL}/user-purchases?user=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error('Failed to fetch purchases');
        return res.json();
    }
};
