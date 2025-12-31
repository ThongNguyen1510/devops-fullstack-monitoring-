import { useState } from 'react';
import './TaskList.css';

function TaskList({ tasks, onAddTask, onUpdateTask, onDeleteTask }) {
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        await onAddTask(newTask);
        setNewTask({ title: '', description: '' });
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
                    <button type="submit" className="btn-primary">Add Task</button>
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
                                                <button onClick={() => handleEdit(task)} className="btn-edit">✏️ Edit</button>
                                                <button onClick={() => onDeleteTask(task.id)} className="btn-delete">🗑️ Delete</button>
                                            </div>
                                        </div>
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
