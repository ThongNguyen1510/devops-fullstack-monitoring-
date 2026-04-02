const pool = require('../config/database');
const logger = require('../config/logger');
const { dbQueryDuration } = require('../middleware/metrics');

class Attachment {
    static async findByTaskId(taskId) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at DESC',
                [taskId]
            );
            dbQueryDuration.labels('findAttachmentsByTask').observe((Date.now() - start) / 1000);
            return result.rows;
        } catch (error) {
            logger.error(`Error fetching attachments for task ${taskId}:`, error);
            throw error;
        }
    }

    static async findById(id) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'SELECT * FROM task_attachments WHERE id = $1',
                [id]
            );
            dbQueryDuration.labels('findAttachmentById').observe((Date.now() - start) / 1000);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching attachment ${id}:`, error);
            throw error;
        }
    }

    static async create(attachmentData) {
        const start = Date.now();
        const { task_id, original_name, s3_key, file_size, mime_type } = attachmentData;

        try {
            const result = await pool.query(
                `INSERT INTO task_attachments (task_id, original_name, s3_key, file_size, mime_type)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [task_id, original_name, s3_key, file_size, mime_type]
            );
            dbQueryDuration.labels('createAttachment').observe((Date.now() - start) / 1000);
            logger.info(`Attachment created: ${result.rows[0].id} for task ${task_id}`);
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating attachment:', error);
            throw error;
        }
    }

    static async delete(id) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'DELETE FROM task_attachments WHERE id = $1 RETURNING *',
                [id]
            );
            dbQueryDuration.labels('deleteAttachment').observe((Date.now() - start) / 1000);

            if (result.rows.length === 0) {
                return null;
            }

            logger.info(`Attachment deleted: ${id}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error deleting attachment ${id}:`, error);
            throw error;
        }
    }

    static async countByTaskId(taskId) {
        const start = Date.now();
        try {
            const result = await pool.query(
                'SELECT COUNT(*) as count FROM task_attachments WHERE task_id = $1',
                [taskId]
            );
            dbQueryDuration.labels('countAttachments').observe((Date.now() - start) / 1000);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error(`Error counting attachments for task ${taskId}:`, error);
            throw error;
        }
    }
}

module.exports = Attachment;
