import { useState, useRef } from 'react';
import FileAttachment from './FileAttachment';
import { attachmentService } from '../services/api';
import './TaskList.css';

function TaskList({ tasks, onAddTask, onUpdateTask, onDeleteTask }) {
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [expandedAttachments, setExpandedAttachments] = useState({});
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        setUploading(true);
        try {
            // 1. Create task first
            const createdTask = await onAddTask(newTask);

            // 2. Upload file if selected
            if (selectedFile && createdTask?.id) {
                await attachmentService.uploadAttachment(createdTask.id, selectedFile);
                // Auto-expand attachments for new task
                setExpandedAttachments((prev) => ({ ...prev, [createdTask.id]: true }));
            }

            // Reset form
            setNewTask({ title: '', description: '' });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Error creating task with file:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (task) => {
        setEditingId(task.id);
        setEditForm({
            title: task.title,
            description: task.description,
            status: task.status
        });
    };

    const handleUpdate = async (id) => {
        await onUpdateTask(id, editForm);
        setEditingId(null);
        setEditForm({});
    };

    const toggleAttachments = (taskId) => {
        setExpandedAttachments((prev) => ({
            ...prev,
            [taskId]: !prev[taskId],
        }));
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'done': return 'status-done';
            case 'in-progress': return 'status-progress';
            default: return 'status-todo';
        }
    };

    return (
        <div className="task-list">
            <div className="add-task-form">
                <h2>➕ Add New Task</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        rows="3"
                    />

                    {/* File Attachment Input */}
                    <div className="form-file-section">
                        <label className="file-select-btn" htmlFor="new-task-file">
                            📎 Attach File
                        </label>
                        <input
                            ref={fileInputRef}
                            id="new-task-file"
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            hidden
                        />
                        {selectedFile && (
                            <div className="selected-file-badge">
                                <span className="selected-file-name">{selectedFile.name}</span>
                                <span className="selected-file-size">
                                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                                </span>
                                <button
                                    type="button"
                                    onClick={removeSelectedFile}
                                    className="selected-file-remove"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={uploading}>
                        {uploading ? '⏳ Creating...' : 'Add Task'}
                    </button>
                </form>
            </div>

            <div className="tasks-container">
                <h2>📋 Tasks ({tasks.length})</h2>
                {tasks.length === 0 ? (
                    <p className="empty-state">No tasks yet. Create one above!</p>
                ) : (
                    <div className="tasks-grid">
                        {tasks.map((task) => (
                            <div key={task.id} className="task-card">
                                {editingId === task.id ? (
                                    <div className="edit-form">
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows="2"
                                        />
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                        <div className="edit-actions">
                                            <button onClick={() => handleUpdate(task.id)} className="btn-success">Save</button>
                                            <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="task-header">
                                            <h3>{task.title}</h3>
                                            <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        {task.description && <p className="task-description">{task.description}</p>}
                                        <div className="task-footer">
                                            <small>Created: {new Date(task.created_at).toLocaleDateString()}</small>
                                            <div className="task-actions">
                                                <button
                                                    onClick={() => toggleAttachments(task.id)}
                                                    className={`btn-attach ${expandedAttachments[task.id] ? 'active' : ''}`}
                                                    title="Attachments"
                                                >
                                                    📎 Files
                                                </button>
                                                <button onClick={() => handleEdit(task)} className="btn-edit">✏️ Edit</button>
                                                <button onClick={() => onDeleteTask(task.id)} className="btn-delete">🗑️ Delete</button>
                                            </div>
                                        </div>

                                        {/* File Attachments Section */}
                                        {expandedAttachments[task.id] && (
                                            <FileAttachment taskId={task.id} />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskList;

