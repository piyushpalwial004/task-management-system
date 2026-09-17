# Task Management App
 Use React + Node.js/Express + PostgreSQL. Implement Kanban To-Do/In Progress/Done with drag-and-drop, task CRUD, priority/due date/description, users/projects, priority filtering, column counters, and red-pulsing avatars when a user has >5 In Progress tasks. Include validation, error/loading/empty states, responsive accessible UI, secure code, database schema, APIs, and proper configuration.

**IMPORTANT GIT RULE:** After creating or modifying **each individual file**, immediately create a separate meaningful Git commit for that file. **Never combine multiple files into one commit.** Each commit must contain changes to only that single file and have a clear message, e.g. `feat: add task model`, `feat: add task API`, `feat: add kanban board`. Do not reset, revert, squash, or discard existing changes. Before moving to the next file, verify and commit the current file.

After implementation, run the appropriate build/tests/type-checks, fix errors, and verify the complete application. Keep the implementation production-ready and ready for GitHub submission.

## Run locally

1. Create a PostgreSQL database and copy `.env.example` to `.env`.
2. Apply `server/schema.sql` to the database.
3. Install dependencies with `npm install`.
4. Start the client and API with `npm run dev`.

The Vite client runs on `http://localhost:5173` and the API runs on `http://localhost:3001`.
