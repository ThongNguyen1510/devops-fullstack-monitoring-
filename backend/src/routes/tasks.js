const express = require('express');
const Task = require('../models/Task');
const logger = require('../config/logger');

const router = express.Router();

// GET all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (error) {
        logger.error('Error in GET /api/tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET single task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        logger.error(`Error in GET /api/tasks/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// POST create new task
router.post('/', async (req, res) => {
    try {
        const { title, description, status } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const task = await Task.create({ title, description, status });
        res.status(201).json(task);
    } catch (error) {
        logger.error('Error in POST /api/tasks:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status } = req.body;
        const task = await Task.update(req.params.id, { title, description, status });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        logger.error(`Error in PUT /api/tasks/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.delete(req.params.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully', task });
    } catch (error) {
        logger.error(`Error in DELETE /api/tasks/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
