CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  initials VARCHAR(4) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#d9e7e4',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'progress', 'done')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_project_status_idx ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS tasks_assignee_status_idx ON tasks(assignee_id, status);

INSERT INTO projects (id, name, description)
VALUES ('9a4c4d40-bb7c-4c60-8b34-4a8888888888', 'Northstar launch', 'The focused plan for getting our next release into the world.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, initials, color, project_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Maya Chen', 'MC', '#ffd7c9', '9a4c4d40-bb7c-4c60-8b34-4a8888888888'),
  ('22222222-2222-4222-8222-222222222222', 'Jon Bell', 'JB', '#cfe3ff', '9a4c4d40-bb7c-4c60-8b34-4a8888888888'),
  ('33333333-3333-4333-8333-333333333333', 'Ari Stone', 'AS', '#ded3ff', '9a4c4d40-bb7c-4c60-8b34-4a8888888888')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, due_date)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '9a4c4d40-bb7c-4c60-8b34-4a8888888888', '11111111-1111-4111-8111-111111111111', 'Polish empty states', 'Give every quiet moment in the product a useful next step.', 'todo', 'high', CURRENT_DATE + 3),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '9a4c4d40-bb7c-4c60-8b34-4a8888888888', '22222222-2222-4222-8222-222222222222', 'Map the onboarding path', 'Sketch the first five minutes from invite to first completed task.', 'todo', 'medium', CURRENT_DATE + 6),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '9a4c4d40-bb7c-4c60-8b34-4a8888888888', '11111111-1111-4111-8111-111111111111', 'Review activity feed', 'Make the important changes visible without adding noise.', 'progress', 'urgent', CURRENT_DATE + 1),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '9a4c4d40-bb7c-4c60-8b34-4a8888888888', '33333333-3333-4333-8333-333333333333', 'Set up release notes', 'Capture the decisions and details that deserve to travel with the release.', 'done', 'low', CURRENT_DATE - 2)
ON CONFLICT (id) DO NOTHING;
