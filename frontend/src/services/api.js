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

export const attachmentService = {
    getAttachments: async (taskId) => {
        const response = await api.get(`/tasks/${taskId}/attachments`);
        return response.data;
    },

    uploadAttachment: async (taskId, file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            },
        });
        return response.data;
    },

    deleteAttachment: async (taskId, attachmentId) => {
        const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
        return response.data;
    },
};

export default api;

