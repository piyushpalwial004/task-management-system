# Taskflow

Taskflow is a focused task management workspace for personal and team productivity. It organizes work on a Kanban board and makes workload visible before it becomes a problem.

## Features

- Kanban workflow with **To-do**, **In progress**, and **Done** columns
- Native drag-and-drop task movement
- Create, edit, and delete tasks
- Task titles, descriptions, priorities, due dates, statuses, and assignees
- Priority filtering and per-column task counters
- Project and team member management
- Team workload indicators with a red-pulsing avatar when a member has more than five in-progress tasks
- Loading, empty, offline/demo, and API error states
- Responsive layout for desktop and mobile screens
- Accessible labels, keyboard focus states, and semantic controls

## Technology

- **Frontend:** React 18, Vite, CSS
- **Backend:** Node.js, Express, `pg`
- **Database:** PostgreSQL
- **Development:** Concurrent Vite and Express processes

## Project structure

```text
src/
  App.jsx          React application and Kanban interactions
  main.jsx         React entrypoint
  styles.css       Responsive application styles
server/
  index.js         Express API and validation
  schema.sql       PostgreSQL schema and seed data
index.html         Vite document entrypoint
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer

## Local setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create a PostgreSQL database named `taskflow`:

	```bash
	createdb taskflow
	```

3. Copy the environment template and update the connection string if needed:

	```bash
	cp .env.example .env
	```

	Example configuration:

	```env
	DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
	PORT=3001
	```

4. Apply the schema and seed data:

	```bash
	psql taskflow -f server/schema.sql
	```

5. Start the frontend and API together:

	```bash
	npm run dev
	```

	Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:3001`.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite and the Express API in development mode |
| `npm run dev:client` | Start only the Vite frontend |
| `npm run dev:server` | Start only the Express API |
| `npm run build` | Create a production frontend build |
| `npm run start` | Start the API server |
| `npm run check` | Run the production frontend build check |

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API and database connectivity |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/projects/:projectId/board` | Load a project, users, tasks, and workload counts |
| `POST` | `/api/projects/:projectId/tasks` | Create a task |
| `PATCH` | `/api/tasks/:taskId` | Update task fields or status |
| `DELETE` | `/api/tasks/:taskId` | Delete a task |
| `POST` | `/api/projects/:projectId/users` | Add a project user |

The API validates required text, task status, priority, due-date format, and request payloads. SQL queries use parameterized values, and database relationships enforce project, user, and task integrity.

## Verification

Run the production build and backend syntax check before submitting:

```bash
npm run build
node --check server/index.js
```

The repository keeps project-file changes in separate meaningful Git commits.
