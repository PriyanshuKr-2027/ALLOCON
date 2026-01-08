-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (global profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table (multi-org membership with per-org role)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('team_lead', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone TEXT,
  module TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_assignments table (many-to-many: task -> members)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Helper functions to avoid self-referential policy recursion
-- Checks if current user is a member of the given org
CREATE OR REPLACE FUNCTION public.is_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = target_org_id AND user_id = auth.uid()
  );
$$;

-- Checks if current user is a team lead of the given org
CREATE OR REPLACE FUNCTION public.is_team_lead(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = target_org_id AND user_id = auth.uid() AND role = 'team_lead'
  );
$$;

-- Policies for organizations table
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their orgs" ON organizations;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their orgs" ON organizations FOR SELECT USING (
    public.is_member(organizations.id)
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create orgs" ON organizations;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create orgs" ON organizations FOR INSERT WITH CHECK (created_by = auth.uid());
END $$;

-- Policies for organization_members table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_members' AND policyname = 'Users can view org members'
) THEN
  CREATE POLICY "Users can view org members" ON organization_members FOR SELECT USING (
    public.is_member(organization_members.org_id)
  );
END IF;
END $$;

DO $$ BEGIN
  CREATE POLICY "Team leads can manage members" ON organization_members FOR INSERT WITH CHECK (
    public.is_team_lead(organization_members.org_id)
  );
END $$;
DO $$ BEGIN
  CREATE POLICY "Team leads can update members" ON organization_members FOR UPDATE USING (
    public.is_team_lead(organization_members.org_id)
  );
END $$;

DO $$ BEGIN
  CREATE POLICY "Team leads can delete members" ON organization_members FOR DELETE USING (
    public.is_team_lead(organization_members.org_id)
  );
END $$;

-- Policies for users table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view org members'
) THEN
  CREATE POLICY "Users can view org members" ON users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om1 
      WHERE om1.user_id = auth.uid() 
      AND EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.org_id = om1.org_id AND om2.user_id = users.id)
    )
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can self-register'
) THEN
  CREATE POLICY "Users can self-register" ON users FOR INSERT WITH CHECK (auth.uid() = id);
END IF;
END $$;

-- Policies for tasks table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Users can view org tasks'
) THEN
  CREATE POLICY "Users can view org tasks" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = tasks.org_id AND user_id = auth.uid())
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can create tasks'
) THEN
  CREATE POLICY "Team leads can create tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = tasks.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can update tasks'
) THEN
  CREATE POLICY "Team leads can update tasks" ON tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = tasks.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Team leads can delete tasks'
) THEN
  CREATE POLICY "Team leads can delete tasks" ON tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = tasks.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

-- Policies for task_assignments table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_assignments' AND policyname = 'Users can view task assignments'
) THEN
  CREATE POLICY "Users can view task assignments" ON task_assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om, tasks t 
      WHERE om.org_id = t.org_id AND t.id = task_assignments.task_id AND om.user_id = auth.uid()
    )
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_assignments' AND policyname = 'Team leads can create assignments'
) THEN
  CREATE POLICY "Team leads can create assignments" ON task_assignments FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om, tasks t 
      WHERE om.org_id = t.org_id AND t.id = task_assignments.task_id AND om.user_id = auth.uid() AND om.role = 'team_lead'
    )
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_assignments' AND policyname = 'Team leads can delete assignments'
) THEN
  CREATE POLICY "Team leads can delete assignments" ON task_assignments FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om, tasks t 
      WHERE om.org_id = t.org_id AND t.id = task_assignments.task_id AND om.user_id = auth.uid() AND om.role = 'team_lead'
    )
  );
END IF;
END $$;

-- Policies for milestones table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Users can view org milestones'
) THEN
  CREATE POLICY "Users can view org milestones" ON milestones FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = milestones.org_id AND user_id = auth.uid())
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can create milestones'
) THEN
  CREATE POLICY "Team leads can create milestones" ON milestones FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = milestones.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can update milestones'
) THEN
  CREATE POLICY "Team leads can update milestones" ON milestones FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = milestones.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Team leads can delete milestones'
) THEN
  CREATE POLICY "Team leads can delete milestones" ON milestones FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = milestones.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

-- Policies for activity_logs table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can view org activity logs'
) THEN
  CREATE POLICY "Users can view org activity logs" ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = activity_logs.org_id AND user_id = auth.uid())
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'All members can insert activity logs'
) THEN
  CREATE POLICY "All members can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = activity_logs.org_id AND user_id = auth.uid())
  );
END IF;
END $$;

-- Policies for resources table
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Users can view org resources'
) THEN
  CREATE POLICY "Users can view org resources" ON resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = resources.org_id AND user_id = auth.uid())
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can create resources'
) THEN
  CREATE POLICY "Team leads can create resources" ON resources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = resources.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can update resources'
) THEN
  CREATE POLICY "Team leads can update resources" ON resources FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = resources.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'Team leads can delete resources'
) THEN
  CREATE POLICY "Team leads can delete resources" ON resources FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE org_id = resources.org_id AND user_id = auth.uid() AND role = 'team_lead')
  );
END IF;
END $$;
