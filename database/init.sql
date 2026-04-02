-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Create task_attachments table for S3 file storage
CREATE TABLE IF NOT EXISTS task_attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);

-- Insert sample data (optional)
INSERT INTO tasks (title, description, status) VALUES
  ('Setup project structure', 'Create backend, frontend, and Docker configuration', 'done'),
  ('Implement REST API', 'Build CRUD endpoints for tasks', 'in-progress'),
  ('Setup monitoring', 'Configure Prometheus, Grafana, and Loki', 'todo'),
  ('Deploy to AWS', 'Setup EC2 and RDS instances', 'todo');
