const pool = require('../config/database');
const logger = require('../config/logger');
const { dbQueryDuration } = require('../middleware/metrics');

class Task {
    static async findAll() {
        const start = Date.now();
        try {
            const result = await pool.query(
                'SELECT * FROM tasks ORDER BY created_at DESC'
            );
            dbQueryDuration.labels('findAll').observe((Date.now() - start) / 1000);
            return result.rows;
        } catch (error) {
            logger.error('Error fetching tasks:', error);
            throw error;
        }
    }

    static async findById(id) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'SELECT * FROM tasks WHERE id = $1',
                [id]
            );
            dbQueryDuration.labels('findById').observe((Date.now() - start) / 1000);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching task ${id}:`, error);
            throw error;
        }
    }

    static async create(taskData) {
        const start = Date.now();
        const { title, description, status = 'todo' } = taskData;

        try {
            const result = await pool.query(
                'INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *',
                [title, description, status]
            );
            dbQueryDuration.labels('create').observe((Date.now() - start) / 1000);
            logger.info(`Task created: ${result.rows[0].id}`);
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating task:', error);
            throw error;
        }
    }

    static async update(id, taskData) {
        const start = Date.now();
        const { title, description, status } = taskData;

        try {
            const result = await pool.query(
                `UPDATE tasks 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
                [title, description, status, id]
            );
            dbQueryDuration.labels('update').observe((Date.now() - start) / 1000);

            if (result.rows.length === 0) {
                return null;
            }

            logger.info(`Task updated: ${id}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error updating task ${id}:`, error);
            throw error;
        }
    }

    static async delete(id) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'DELETE FROM tasks WHERE id = $1 RETURNING *',
                [id]
            );
            dbQueryDuration.labels('delete').observe((Date.now() - start) / 1000);

            if (result.rows.length === 0) {
                return null;
            }

            logger.info(`Task deleted: ${id}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error deleting task ${id}:`, error);
            throw error;
        }
    }
}

module.exports = Task;
