import { useState, useEffect, useRef } from 'react';
import { attachmentService } from '../services/api';
import './FileAttachment.css';

function FileAttachment({ taskId }) {
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAttachments();
    }, [taskId]);

    const fetchAttachments = async () => {
        try {
            const data = await attachmentService.getAttachments(taskId);
            setAttachments(data);
        } catch (err) {
            console.error('Error fetching attachments:', err);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const newAttachment = await attachmentService.uploadAttachment(
                taskId,
                file,
                (progress) => setUploadProgress(progress)
            );
            setAttachments([newAttachment, ...attachments]);
            setUploadProgress(100);
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to upload file';
            setError(message);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1500);
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!confirm('Delete this attachment?')) return;

        try {
            await attachmentService.deleteAttachment(taskId, attachmentId);
            setAttachments(attachments.filter(a => a.id !== attachmentId));
        } catch (err) {
            setError('Failed to delete attachment');
            console.error('Delete error:', err);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
            e.target.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType === 'text/plain') return '📃';
        return '📎';
    };

    const isImage = (mimeType) => mimeType.startsWith('image/');

    return (
        <div className="file-attachment">
            {/* Upload Zone */}
            <div
                className={`drop-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    hidden
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />

                {uploading ? (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span className="progress-text">{uploadProgress}%</span>
                    </div>
                ) : (
                    <div className="drop-zone-content">
                        <span className="drop-icon">📁</span>
                        <span className="drop-text">
                            Drop file here or <strong>click to browse</strong>
                        </span>
                        <span className="drop-hint">Max 10MB · Images, PDF, DOC, TXT</span>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="attachment-error">
                    ⚠️ {error}
                    <button onClick={() => setError(null)} className="error-close">✕</button>
                </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="attachments-list">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                            <div className="attachment-preview">
                                {isImage(attachment.mime_type) && attachment.download_url ? (
                                    <img
                                        src={attachment.download_url}
                                        alt={attachment.original_name}
                                        className="attachment-thumbnail"
                                    />
                                ) : (
                                    <span className="attachment-icon">
                                        {getFileIcon(attachment.mime_type)}
                                    </span>
                                )}
                            </div>
                            <div className="attachment-info">
                                <span className="attachment-name" title={attachment.original_name}>
                                    {attachment.original_name}
                                </span>
                                <span className="attachment-meta">
                                    {formatFileSize(attachment.file_size)}
                                </span>
                            </div>
                            <div className="attachment-actions">
                                {attachment.download_url && (
                                    <a
                                        href={attachment.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-download"
                                        title="Download"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        ⬇️
                                    </a>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(attachment.id);
                                    }}
                                    className="btn-remove"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FileAttachment;
