const express = require('express');
const multer = require('multer');
const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const logger = require('../config/logger');
const { uploadFile, deleteFile, getPresignedUrl, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_TASK } = require('../config/s3');

const router = express.Router();

// Configure multer for memory storage (files stored in buffer before S3 upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
        }
    },
});

// GET all attachments for a task
router.get('/:taskId/attachments', async (req, res) => {
    try {
        const { taskId } = req.params;

        // Check if task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const attachments = await Attachment.findByTaskId(taskId);

        // Generate presigned URLs for each attachment
        const attachmentsWithUrls = await Promise.all(
            attachments.map(async (attachment) => {
                try {
                    const downloadUrl = await getPresignedUrl(attachment.s3_key);
                    return { ...attachment, download_url: downloadUrl };
                } catch (error) {
                    logger.error(`Error generating presigned URL for ${attachment.s3_key}:`, error);
                    return { ...attachment, download_url: null };
                }
            })
        );

        res.json(attachmentsWithUrls);
    } catch (error) {
        logger.error(`Error in GET /api/tasks/${req.params.taskId}/attachments:`, error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// POST upload attachment to a task
router.post('/:taskId/attachments', upload.single('file'), async (req, res) => {
    try {
        const { taskId } = req.params;

        // Check if task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check file limit per task
        const currentCount = await Attachment.countByTaskId(taskId);
        if (currentCount >= MAX_FILES_PER_TASK) {
            return res.status(400).json({
                error: `Maximum ${MAX_FILES_PER_TASK} files per task allowed. Current: ${currentCount}`,
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Upload to S3
        const s3Result = await uploadFile(req.file, taskId);

        // Save metadata to database
        const attachment = await Attachment.create({
            task_id: taskId,
            original_name: s3Result.originalName,
            s3_key: s3Result.s3Key,
            file_size: s3Result.fileSize,
            mime_type: s3Result.mimeType,
        });

        // Generate presigned URL for immediate use
        const downloadUrl = await getPresignedUrl(attachment.s3_key);

        res.status(201).json({ ...attachment, download_url: downloadUrl });
    } catch (error) {
        // Handle multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            });
        }

        logger.error(`Error in POST /api/tasks/${req.params.taskId}/attachments:`, error);
        res.status(500).json({ error: error.message || 'Failed to upload attachment' });
    }
});

// DELETE attachment
router.delete('/:taskId/attachments/:attachmentId', async (req, res) => {
    try {
        const { taskId, attachmentId } = req.params;

        // Find attachment
        const attachment = await Attachment.findById(attachmentId);
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Verify attachment belongs to the specified task
        if (attachment.task_id !== parseInt(taskId)) {
            return res.status(403).json({ error: 'Attachment does not belong to this task' });
        }

        // Delete from S3
        await deleteFile(attachment.s3_key);

        // Delete from database
        await Attachment.delete(attachmentId);

        res.json({ message: 'Attachment deleted successfully', attachment });
    } catch (error) {
        logger.error(`Error in DELETE /api/tasks/${req.params.taskId}/attachments/${req.params.attachmentId}:`, error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

module.exports = router;
