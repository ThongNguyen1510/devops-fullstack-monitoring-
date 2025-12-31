import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import { taskService } from './services/api';
import './App.css';

function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await taskService.getAllTasks();
            setTasks(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch tasks. Please check if the backend is running.');
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAddTask = async (taskData) => {
        try {
            const newTask = await taskService.createTask(taskData);
            setTasks([newTask, ...tasks]);
        } catch (err) {
            setError('Failed to create task');
            console.error('Error creating task:', err);
        }
    };

    const handleUpdateTask = async (id, taskData) => {
        try {
            const updatedTask = await taskService.updateTask(id, taskData);
            setTasks(tasks.map(task => task.id === id ? updatedTask : task));
        } catch (err) {
            setError('Failed to update task');
            console.error('Error updating task:', err);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await taskService.deleteTask(id);
            setTasks(tasks.filter(task => task.id !== id));
        } catch (err) {
            setError('Failed to delete task');
            console.error('Error deleting task:', err);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>🚀 DevOps Task Manager</h1>
                    <p>Full-stack app with CI/CD, Docker & Monitoring</p>
                </div>
            </header>

            <main className="app-main">
                {error && (
                    <div className="error-banner">
                        ⚠️ {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading tasks...</p>
                    </div>
                ) : (
                    <TaskList
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                )}
            </main>

            <footer className="app-footer">
                <p>Built with React + Node.js + PostgreSQL + Docker + GitHub Actions</p>
                <p>Monitoring: Prometheus + Grafana + Loki</p>
            </footer>
        </div>
    );
}

export default App;
