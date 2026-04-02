const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('./logger');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'devops-task-manager-attachments';

// Allowed file types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_TASK = 5;

/**
 * Upload a file to S3
 */
async function uploadFile(file, taskId) {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `tasks/${taskId}/${timestamp}-${sanitizedName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'original-name': file.originalname,
            'task-id': String(taskId),
        },
    });

    await s3Client.send(command);
    logger.info(`File uploaded to S3: ${s3Key}`);

    return {
        s3Key,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
    };
}

/**
 * Delete a file from S3
 */
async function deleteFile(s3Key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: ${s3Key}`);
}

/**
 * Generate a presigned URL for file download (expires in 1 hour)
 */
async function getPresignedUrl(s3Key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
}

module.exports = {
    s3Client,
    uploadFile,
    deleteFile,
    getPresignedUrl,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    MAX_FILES_PER_TASK,
    BUCKET_NAME,
};
