-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('team_lead', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  milestone TEXT,
  module TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  deadline TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view all users'
) THEN
  CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can self-register or team leads can insert'
) THEN
  CREATE POLICY "Users can self-register or team leads can insert" ON users FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Team leads can update users'
) THEN
  CREATE POLICY "Team leads can update users" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Team leads can delete users'
) THEN
  CREATE POLICY "Team leads can delete users" ON users FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

-- Policies for tasks table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'All users can view tasks'
) THEN
  CREATE POLICY "All users can view tasks" ON tasks FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can insert tasks'
) THEN
  CREATE POLICY "Team leads can insert tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can update tasks'
) THEN
  CREATE POLICY "Team leads can update tasks" ON tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can delete tasks'
) THEN
  CREATE POLICY "Team leads can delete tasks" ON tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

-- Policies for milestones table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'All users can view milestones'
) THEN
  CREATE POLICY "All users can view milestones" ON milestones FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can insert milestones'
) THEN
  CREATE POLICY "Team leads can insert milestones" ON milestones FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can update milestones'
) THEN
  CREATE POLICY "Team leads can update milestones" ON milestones FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can delete milestones'
) THEN
  CREATE POLICY "Team leads can delete milestones" ON milestones FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

-- Policies for activity_logs table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Team leads can view activity logs'
) THEN
  CREATE POLICY "Team leads can view activity logs" ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'All users can insert activity logs'
) THEN
  CREATE POLICY "All users can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);
END IF;
END $$;

-- Policies for resources table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'All users can view resources'
) THEN
  CREATE POLICY "All users can view resources" ON resources FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can insert resources'
) THEN
  CREATE POLICY "Team leads can insert resources" ON resources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can update resources'
) THEN
  CREATE POLICY "Team leads can update resources" ON resources FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can delete resources'
) THEN
  CREATE POLICY "Team leads can delete resources" ON resources FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;
