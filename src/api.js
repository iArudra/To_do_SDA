const API_URL = 'http://localhost:5000/api';

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
    }
};
