import { useEffect, useMemo, useState } from 'react';

const projectId = 'demo-project';
const columns = [
  { id: 'todo', label: 'To-do', note: 'Up next' },
  { id: 'progress', label: 'In progress', note: 'In motion' },
  { id: 'done', label: 'Done', note: 'Shipped' },
];
const priorities = ['all', 'urgent', 'high', 'medium', 'low'];
const demoUsers = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', color: '#ffd7c9' },
  { id: 'jon', name: 'Jon Bell', initials: 'JB', color: '#cfe3ff' },
  { id: 'ari', name: 'Ari Stone', initials: 'AS', color: '#ded3ff' },
];
const demoTasks = [
  { id: 'demo-1', title: 'Polish empty states', description: 'Give every quiet moment in the product a useful next step.', status: 'todo', priority: 'high', dueDate: '2026-09-20', assigneeId: 'maya', assignee: demoUsers[0] },
  { id: 'demo-2', title: 'Map the onboarding path', description: 'Sketch the first five minutes from invite to first completed task.', status: 'todo', priority: 'medium', dueDate: '2026-09-23', assigneeId: 'jon', assignee: demoUsers[1] },
  { id: 'demo-3', title: 'Review activity feed', description: 'Make important changes visible without adding noise.', status: 'progress', priority: 'urgent', dueDate: '2026-09-18', assigneeId: 'maya', assignee: demoUsers[0] },
  { id: 'demo-4', title: 'Set up release notes', description: 'Capture the decisions that deserve to travel with the release.', status: 'done', priority: 'low', dueDate: '2026-09-15', assigneeId: 'ari', assignee: demoUsers[2] },
];

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatDate(date) {
  if (!date) return 'No due date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function priorityLabel(priority) {
  return priority === 'urgent' ? 'Urgent' : priority[0].toUpperCase() + priority.slice(1);
}

async function request(path, options) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }
  return response.status === 204 ? null : response.json();
}

function Avatar({ user, pulse = false, small = false }) {
  return (
    <span className={`avatar ${small ? 'avatar-small' : ''} ${pulse ? 'avatar-alert' : ''}`} style={{ '--avatar-color': user.color }} title={`${user.name}${pulse ? ' · workload alert' : ''}`}>
      {user.initials}
    </span>
  );
}

function TaskCard({ task, onDragStart, onDelete, onEdit }) {
  return (
    <article className="task-card" draggable onDragStart={(event) => onDragStart(event, task.id)}>
      <div className="task-card-topline">
        <span className={`priority priority-${task.priority}`}><i />{priorityLabel(task.priority)}</span>
        <button className="icon-button" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`} title="Delete task">×</button>
      </div>
      <button className="task-title" onClick={() => onEdit(task)}>{task.title}</button>
      <p>{task.description || 'No description added yet.'}</p>
      <div className="task-card-footer">
        <span className="due-date"><span aria-hidden="true">◷</span>{formatDate(task.dueDate)}</span>
        {task.assignee && <Avatar user={task.assignee} small />}
      </div>
    </article>
  );
}

function TaskModal({ task, users, onClose, onSave }) {
  const [form, setForm] = useState(task || { title: '', description: '', priority: 'medium', dueDate: '', status: 'todo', assigneeId: '' });
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><span className="eyebrow">Task details</span><h2>{task ? 'Edit task' : 'New task'}</h2></div>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <label>Task title<input autoFocus value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="What needs to move forward?" maxLength="180" required /></label>
        <label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Add context for your future self..." rows="4" /></label>
        <div className="form-grid">
          <label>Priority<select value={form.priority} onChange={(event) => update('priority', event.target.value)}>{priorities.slice(1).map((priority) => <option key={priority} value={priority}>{priorityLabel(priority)}</option>)}</select></label>
          <label>Due date<input type="date" value={form.dueDate || ''} onChange={(event) => update('dueDate', event.target.value)} /></label>
          <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</select></label>
          <label>Assignee<select value={form.assigneeId || ''} onChange={(event) => update('assigneeId', event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        </div>
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving...' : task ? 'Save changes' : 'Create task'}</button></div>
      </form>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState({ name: 'Northstar launch', description: 'The focused plan for getting our next release into the world.' });
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeView, setActiveView] = useState('board');
  const [modalTask, setModalTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [offline, setOffline] = useState(false);

  async function loadBoard() {
    setLoading(true);
    try {
      const board = await request(`/projects/${projectId}/board`);
      setProject(board.project);
      setUsers(board.users);
      setTasks(board.tasks);
      setOffline(false);
    } catch {
      setProject({ name: 'Northstar launch', description: 'The focused plan for getting our next release into the world.' });
      setUsers(demoUsers);
      setTasks(demoTasks);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBoard(); }, []);

  const workload = useMemo(() => users.map((user) => ({ ...user, inProgress: tasks.filter((task) => task.assigneeId === user.id && task.status === 'progress').length })), [tasks, users]);
  const filteredTasks = useMemo(() => priorityFilter === 'all' ? tasks : tasks.filter((task) => task.priority === priorityFilter), [priorityFilter, tasks]);
  const totalDone = tasks.filter((task) => task.status === 'done').length;

  function moveTask(taskId, status) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task));
    request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch(() => setNotice('Saved locally. Connect the API to sync this change.'));
  }

  function handleDragStart(event, taskId) {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(event, status) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) moveTask(taskId, status);
  }

  async function saveTask(form) {
    const assignee = users.find((user) => user.id === form.assigneeId) || null;
    const optimistic = { ...form, id: form.id || `local-${Date.now()}`, assignee };
    setTasks((current) => form.id ? current.map((task) => task.id === form.id ? optimistic : task) : [optimistic, ...current]);
    setModalTask(null);
    try {
      if (offline) throw new Error('offline');
      if (form.id) await request(`/tasks/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(form) });
      setNotice('Task synced');
    } catch {
      setNotice('Task saved locally. Connect the API to sync it.');
    }
  }

  async function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    try {
      if (offline) throw new Error('offline');
      await request(`/tasks/${taskId}`, { method: 'DELETE' });
    } catch {
      setNotice('Task removed locally.');
    }
  }

  async function addUser() {
    const name = window.prompt('Add a teammate by name');
    if (!name?.trim()) return;
    const newUser = { id: `local-user-${Date.now()}`, name: name.trim(), initials: name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: '#d3eadb' };
    setUsers((current) => [...current, newUser]);
    try {
      if (offline) throw new Error('offline');
      const saved = await request(`/projects/${projectId}/users`, { method: 'POST', body: JSON.stringify({ name }) });
      setUsers((current) => current.map((user) => user.id === newUser.id ? saved : user));
    } catch {
      setNotice('Teammate added locally. Connect the API to sync it.');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>taskflow</span></div>
        <div className="workspace-switcher"><span className="workspace-dot" />Northstar studio<span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === 'board' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('board')}><span>▦</span>Board</button>
          <button className={activeView === 'timeline' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('timeline')}><span>◴</span>Timeline</button>
          <button className={activeView === 'team' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('team')}><span>♧</span>Team</button>
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-label">Your workspace</div><button className="nav-item"><span>⚙</span>Settings</button><button className="profile"><span className="profile-avatar">PK</span><span><strong>Piyush Kumar</strong><small>Admin</small></span><span className="chevron">⌄</span></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Projects</span><b>/</b><strong>{project.name}</strong></div><div className="topbar-actions"><button className="help-button" aria-label="Help">?</button><button className="notification-button" aria-label="Notifications">♧<i /></button><button className="button button-dark button-small" onClick={() => setModalTask({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo', assigneeId: '' })}>+ New task</button></div></header>
        {offline && <div className="offline-banner"><span>◌</span> Demo mode is active. Start the API and connect PostgreSQL to sync changes.<button onClick={loadBoard}>Try again</button></div>}
        <section className="page-heading"><div><span className="eyebrow">Project / September 2026</span><h1>{project.name}</h1><p>{project.description}</p></div><div className="heading-metric"><strong>{totalDone}<span>/</span>{tasks.length}</strong><span>tasks completed</span></div></section>
        <section className="team-strip"><div className="team-intro"><span className="team-icon">♧</span><div><strong>Team pulse</strong><span>Workload at a glance</span></div></div><div className="team-members">{workload.map((user) => <div className="team-member" key={user.id}><Avatar user={user} pulse={user.inProgress > 5} /><span><strong>{user.name}</strong><small>{user.inProgress} in progress {user.inProgress > 5 && '· attention'}</small></span></div>)}<button className="add-member" onClick={addUser} aria-label="Add teammate" title="Add teammate">+</button></div></section>
        {notice && <button className="notice" onClick={() => setNotice('')}>{notice} <span>×</span></button>}
        {activeView === 'board' ? <>
          <div className="board-toolbar"><div className="view-tabs"><button className="view-tab active">Board <span>{tasks.length}</span></button><button className="view-tab">Activity</button></div><div className="board-controls"><label className="filter-control"><span>Filter</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>{priorities.map((priority) => <option key={priority} value={priority}>{priority === 'all' ? 'All priorities' : priorityLabel(priority)}</option>)}</select></label><button className="sort-button">↕ <span>Sort</span></button></div></div>
          {loading ? <div className="empty-state"><div className="loader" /><p>Loading your workspace...</p></div> : <div className="board">{columns.map((column) => { const columnTasks = filteredTasks.filter((task) => task.status === column.id); return <section className="board-column" key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column.id)}><div className="column-heading"><div><h2>{column.label} <span>{columnTasks.length}</span></h2><small>{column.note}</small></div><button className="column-menu" aria-label={`${column.label} options`}>···</button></div><div className="column-cards">{columnTasks.map((task) => <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={deleteTask} onEdit={setModalTask} />)}{!columnTasks.length && <div className="column-empty">Drop a task here<span>or create one above</span></div>}</div></section>; })}</div>}
        </> : <div className="alternate-view"><span className="alternate-icon">{activeView === 'timeline' ? '◴' : '♧'}</span><h2>{activeView === 'timeline' ? 'Timeline is taking shape' : 'Your team, in one view'}</h2><p>{activeView === 'timeline' ? 'Drag tasks between board columns to keep momentum visible.' : 'Invite teammates and watch workload balance update in real time.'}</p><button className="button button-dark" onClick={() => setActiveView('board')}>Back to board</button></div>}
      </main>
      {modalTask && <TaskModal task={modalTask.id ? modalTask : null} users={users} onClose={() => setModalTask(null)} onSave={saveTask} />}
    </div>
  );
}

export default App;
