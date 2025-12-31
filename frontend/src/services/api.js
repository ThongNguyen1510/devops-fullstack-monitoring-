import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const taskService = {
    getAllTasks: async () => {
        const response = await api.get('/tasks');
        return response.data;
    },

    getTask: async (id) => {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    createTask: async (taskData) => {
        const response = await api.post('/tasks', taskData);
        return response.data;
    },

    updateTask: async (id, taskData) => {
        const response = await api.put(`/tasks/${id}`, taskData);
        return response.data;
    },

    deleteTask: async (id) => {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    }
};

export default api;
