import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const allowedStatuses = new Set(['todo', 'progress', 'done']);
const allowedPriorities = new Set(['urgent', 'high', 'medium', 'low']);

function requireText(value, label, maxLength = 180) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  if (value.trim().length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
  return value.trim();
}

function validateTaskInput(body, partial = false) {
  const task = {};
  if (!partial || body.title !== undefined) task.title = requireText(body.title, 'Title');
  if (!partial || body.description !== undefined) {
    task.description = typeof body.description === 'string' ? body.description.trim() : '';
  }
  if (!partial || body.status !== undefined) {
    if (!allowedStatuses.has(body.status)) throw new Error('Status is invalid');
    task.status = body.status;
  }
  if (!partial || body.priority !== undefined) {
    if (!allowedPriorities.has(body.priority)) throw new Error('Priority is invalid');
    task.priority = body.priority;
  }
  if (!partial || body.dueDate !== undefined) {
    if (body.dueDate !== null && body.dueDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      throw new Error('Due date must use YYYY-MM-DD');
    }
    task.dueDate = body.dueDate || null;
  }
  if (body.assigneeId !== undefined) task.assigneeId = body.assigneeId || null;
  return task;
}

function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assigneeId: row.assignee_id,
    assignee: row.assignee_name ? { id: row.assignee_id, name: row.assignee_name, initials: row.assignee_initials, color: row.assignee_color } : null,
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable', message: 'Database connection is unavailable.' });
  }
});

app.get('/api/projects', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description FROM projects ORDER BY created_at');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/projects/:projectId/board', async (req, res, next) => {
  try {
    const projectQuery = pool.query('SELECT id, name, description FROM projects WHERE id = $1', [req.params.projectId]);
    const usersQuery = pool.query('SELECT id, name, initials, color FROM users WHERE project_id = $1 ORDER BY name', [req.params.projectId]);
    const tasksQuery = pool.query(`
      SELECT t.*, u.name AS assignee_name, u.initials AS assignee_initials, u.color AS assignee_color
      FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = $1 ORDER BY t.created_at DESC
    `, [req.params.projectId]);
    const [{ rows: projects }, { rows: users }, { rows: tasks }] = await Promise.all([projectQuery, usersQuery, tasksQuery]);
    if (!projects[0]) return res.status(404).json({ message: 'Project not found' });

    const workload = users.map((user) => ({
      userId: user.id,
      inProgress: tasks.filter((task) => task.assignee_id === user.id && task.status === 'progress').length,
    }));
    res.json({ project: projects[0], users, tasks: tasks.map(serializeTask), workload });
  } catch (error) {
    next(error);
  }
});

app.post('/api/projects/:projectId/tasks', async (req, res, next) => {
  try {
    const task = validateTaskInput(req.body);
    const { rows } = await pool.query(`
      INSERT INTO tasks (project_id, assignee_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.params.projectId, task.assigneeId || null, task.title, task.description, task.status, task.priority, task.dueDate]);
    res.status(201).json(serializeTask(rows[0]));
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('must')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

app.patch('/api/tasks/:taskId', async (req, res, next) => {
  try {
    const task = validateTaskInput(req.body, true);
    const fields = Object.keys(task);
    if (!fields.length) return res.status(400).json({ message: 'No changes supplied' });
    const values = fields.map((field) => task[field]);
    const assignments = fields.map((field, index) => `${field === 'dueDate' ? 'due_date' : field === 'assigneeId' ? 'assignee_id' : field} = $${index + 1}`);
    values.push(req.params.taskId);
    const { rows } = await pool.query(`UPDATE tasks SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ message: 'Task not found' });
    res.json(serializeTask(rows[0]));
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('must')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

app.delete('/api/tasks/:taskId', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);
    if (!result.rowCount) return res.status(404).json({ message: 'Task not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/projects/:projectId/users', async (req, res, next) => {
  try {
    const name = requireText(req.body.name, 'Name', 120);
    const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#ffd7c9', '#cfe3ff', '#ded3ff', '#d3eadb', '#ffe7a8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { rows } = await pool.query(`
      INSERT INTO users (name, initials, color, project_id) VALUES ($1, $2, $3, $4)
      RETURNING id, name, initials, color
    `, [name, initials, color, req.params.projectId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('must')) return res.status(400).json({ message: error.message });
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(port, () => console.log(`Taskflow API listening on http://localhost:${port}`));
