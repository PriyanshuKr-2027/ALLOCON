# Development Commands

## Install Dependencies
```bash
npm install
```

## Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Build for Production
```bash
npm run build
```

## Start Production Server
```bash
npm start
```

## Lint Code
```bash
npm run lint
```

## Environment Setup

### Create .env.local file
```bash
# Copy the example file
cp .env.local.example .env.local

# Then edit .env.local and add your Supabase credentials
```

## Supabase Setup

### 1. Create Database Tables
- Go to Supabase Dashboard → SQL Editor
- Copy content from `supabase-schema.sql`
- Run the SQL script

### 2. Verify Tables Created
```sql
-- Run this in Supabase SQL Editor to verify
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: users, tasks, milestones, activity_logs
```

### 3. Check RLS Policies
```sql
-- Run this to see all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## First User Setup

### Make First User a Team Lead
```sql
-- After signing up, run this in Supabase SQL Editor
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET role = 'team_lead' 
WHERE email = 'your-email@example.com';
```

## Troubleshooting Commands

### Check if user exists in database
```sql
SELECT * FROM users WHERE email = 'your-email@example.com';
```

### View all users
```sql
SELECT id, name, email, role, status FROM users;
```

### View all tasks
```sql
SELECT id, title, status, assigned_to, created_by FROM tasks;
```

### View activity logs
```sql
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

### Reset a user's password (in Supabase Dashboard)
- Go to Authentication → Users
- Click on user
- Click "Send Password Reset"

## Development Tips

### Hot Reload Issues
If changes aren't reflecting:
```bash
# Stop the server (Ctrl+C)
# Delete .next folder
rm -rf .next

# Restart
npm run dev
```

### Clear Node Modules
```bash
# Remove node_modules
rm -rf node_modules

# Reinstall
npm install
```

### TypeScript Errors
```bash
# Check TypeScript errors
npx tsc --noEmit
```

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

### Environment Variables for Production
```
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## Useful Supabase Queries

### Create a new team lead manually
```sql
INSERT INTO users (id, name, email, role, status)
VALUES (
  'user-uuid-from-auth-users',
  'Team Lead Name',
  'teamlead@example.com',
  'team_lead',
  'active'
);
```

### Assign a task to a user
```sql
UPDATE tasks 
SET assigned_to = 'user-uuid' 
WHERE id = 'task-uuid';
```

### View task assignments
```sql
SELECT 
  t.title as task,
  u.name as assigned_to,
  t.status
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id;
```

### Get activity summary
```sql
SELECT 
  action, 
  COUNT(*) as count 
FROM activity_logs 
GROUP BY action;
```

## Testing Checklist

### After Setup
- [ ] Can access login page
- [ ] Can sign up new user
- [ ] Can login with credentials
- [ ] Dashboard loads with stats
- [ ] All menu items are visible
- [ ] Can create milestone (Team Lead)
- [ ] Can create task (Team Lead)
- [ ] Can view tasks (Member)
- [ ] Activity log works (Team Lead)
- [ ] Team page shows members

### RBAC Testing
- [ ] Team Lead can create tasks
- [ ] Team Lead can assign tasks
- [ ] Team Lead can view activity log
- [ ] Members see only their tasks
- [ ] Members cannot create tasks
- [ ] Members cannot access activity log
- [ ] Inactive members cannot login

## Quick Database Reset

### ⚠️ WARNING: This will delete all data!
```sql
-- Delete all data (keep tables)
TRUNCATE activity_logs, tasks, milestones, users CASCADE;

-- Note: auth.users is managed by Supabase Auth
```

## Backup Data

### Export users
```sql
COPY users TO '/tmp/users_backup.csv' CSV HEADER;
```

### Export tasks
```sql
COPY tasks TO '/tmp/tasks_backup.csv' CSV HEADER;
```

---

**Need more help?** Check README.md or SETUP_GUIDE.md
