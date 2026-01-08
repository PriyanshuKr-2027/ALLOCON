# ALLOCON - Project Management System and Task Allocation

A production-ready, responsive project management and documentation website with role-based permissions, Supabase backend, and team task control.

## 🌟 Features

### Core Functionality
- **Role-Based Access Control (RBAC)**: Team Lead and Member roles with distinct permissions
- **Project Management**: Milestones, tasks, and team management
- **Resources Storage**: Upload, preview, download, and delete via Supabase Storage
- **AI Assistant**: Floating chat on Tasks page for help and tips
- **Real-time Updates**: Powered by Supabase
- **Activity Tracking**: Comprehensive activity logs for Team Leads
- **Responsive Design**: Works seamlessly on all devices

### Pages & Features

#### 1. Overview 
- Project information and problem statement
- Technology stack display
- Real-time progress metrics
- Milestone timeline

#### 2. Dashboard
- Task statistics and completion rates
- Member-wise task distribution (Team Lead only)
- Status distribution charts
- Overall progress tracking

#### 3. Milestones & Modules
- Create and manage project milestones
- Track deliverables and timelines
- Expandable milestone cards

#### 4. Team Members
- **Active/Inactive tabs**
- Team Lead can:
  - Add/remove members
  - Toggle member status (active/inactive)
- Members can:
  - View team roster (read-only)

#### 5. Tasks
- **Team Lead can:**
  - Create new tasks
  - Assign/reassign tasks to members
  - Update task status
  - Set deadlines and milestones
  - Full task management
  
- **Members can:**
  - View assigned tasks only
  - See task details and deadlines
  - Read-only access

#### 6. Resources & Downloads
- Upload project files (Team Lead)
- Preview supported files (images, PDFs)
- Download for all users
- Delete (Team Lead)

#### 7. AI Chat (Tasks Page)
- Floating chat widget on Tasks
- Helps with task management, planning, and productivity tips

#### 8. Activity Log (Team Lead Only)
- Track all project activities
- Task assignments and status changes
- Member additions and updates
- Timestamped activity trail

## 🔐 Role-Based Permissions

### Team Lead
✅ **Can:**
- Add/edit/delete team members
- Mark members as active/inactive
- Create, assign, and reassign tasks
- Update task status
- Create milestones and modules
- View all dashboards and activity logs
- Full system access

### Team Member
✅ **Can:**
- View assigned tasks
- View project milestones and modules
- View task deadlines and status
- View team roster

❌ **Cannot:**
- Assign or reassign tasks
- Add or remove members
- Create or delete tasks
- Edit milestones or modules
- View activity logs

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **AI**: OpenRouter (DeepSeek R1)
- **State Management**: Zustand
- **Icons**: React Icons

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd "Project managament and task allocations"

# Install dependencies
npm install
```

### Step 2: Set Up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL script

3. **Get your Supabase credentials**:
   - Go to Project Settings > API
   - Copy your `Project URL` and `anon public` key

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Storage bucket name (default used in this project)
NEXT_PUBLIC_SUPABASE_BUCKET=resource
```

Replace the values with your actual Supabase credentials.

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Storage Bucket Setup (once)

- Create a public bucket in Supabase Storage (we use `resource`)
- Ensure storage policies allow: read for all, insert/update/delete for team lead
- See the full guide in `SUPABASE_STORAGE_SETUP.md`

## 🚀 Getting Started

### First Time Setup

1. **Sign Up**: Create your first account
   - New users automatically get "Member" role
   - Go to `/signup` or click "Sign Up" on the login page

2. **Make yourself Team Lead**:
   - Go to Supabase Dashboard > Table Editor > `users` table
   - Find your user record
   - Change `role` from `member` to `team_lead`
   - Refresh the application

3. **Start Managing**:
   - Create milestones
   - Add tasks
   - Invite team members (share the URL)

### Adding Team Members

1. Share the application URL with team members
2. They sign up with their email and password
3. They automatically get "Member" role
4. As Team Lead, you can activate/deactivate them from the Team page

## 📊 Database Schema

### Users Table
```sql
- id: UUID (references auth.users)
- name: TEXT
- email: TEXT (unique)
- role: TEXT (team_lead | member)
- status: TEXT (active | inactive)
- created_at: TIMESTAMP
```

### Tasks Table
```sql
- id: UUID
- title: TEXT
- description: TEXT
- milestone: TEXT
- module: TEXT
- status: TEXT (todo | in_progress | completed)
- deadline: TIMESTAMP (nullable)
- assigned_to: UUID (references users)
- created_by: UUID (references users)
- created_at: TIMESTAMP
```

### Milestones Table
```sql
- id: UUID
- title: TEXT
- duration: TEXT
- description: TEXT
- order: INTEGER
- created_at: TIMESTAMP
```

### Activity Logs Table
```sql
- id: UUID
- action: TEXT
- user_id: UUID (references users)
- user_name: TEXT
- details: TEXT
- created_at: TIMESTAMP
```

### Resources Table
```sql
- id: UUID
- title: TEXT
- description: TEXT (nullable)
- file_name: TEXT
- file_path: TEXT
- file_type: TEXT
- file_size: INTEGER (nullable)
- uploaded_by: UUID (references users)
- created_at: TIMESTAMP
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Authentication**: Secure email/password authentication
- **Role-based Policies**: Database-level permission enforcement
- **Status-based Access**: Inactive users cannot access the system
- **Activity Tracking**: All critical actions are logged
- **Idempotent Policies**: `supabase-schema.sql` safely creates policies only if missing (re-runnable)

## 🎨 UI/UX Features

- **Dark Mode**: Professional dark theme
- **Responsive Design**: Mobile, tablet, and desktop support
- **Clean Interface**: Academic + corporate aesthetic
- **Real-time Stats**: Live dashboard updates
- **Status Badges**: Visual task status indicators
- **Permission Messages**: Clear feedback for unauthorized actions

## 📁 Project Structure

```
├── app/
│   ├── dashboard/
│   │   ├── activity/         # Activity log page
│   │   ├── milestones/       # Milestones page
│   │   ├── resources/        # Resources page
│   │   ├── stats/            # Dashboard stats
│   │   ├── tasks/            # Tasks management
│   │   ├── team/             # Team management
│   │   ├── layout.tsx        # Dashboard layout
│   │   └── page.tsx          # Overview page
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home redirect
├── components/
│   ├── Modal.tsx             # Reusable modal
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── AIChatbot.tsx         # Floating AI assistant (Tasks page)
│   ├── StatCard.tsx          # Stat display card
│   └── StatusBadge.tsx       # Task status badge
├── lib/
│   ├── store.ts              # Zustand state management
│   └── supabase.ts           # Supabase client & types
├── supabase-schema.sql       # Database schema (with idempotent RLS policies)
├── SUPABASE_STORAGE_SETUP.md # Storage setup guide
├── package.json
└── README.md
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_BUCKET`
5. Deploy!

### Environment Variables for Production

Make sure to set the same environment variables in your deployment platform as you have in `.env.local`.

## 🐛 Troubleshooting

### "User not found" after login
- Ensure the `users` table has a record for your auth user
- Check that Supabase Auth is properly configured

### RLS Errors
- Verify that Row Level Security policies are created
- Check that your user role is set correctly in the database

### Storage Upload Fails
- Ensure the bucket exists per `NEXT_PUBLIC_SUPABASE_BUCKET`
- Bucket should be Public
- Confirm storage policies allow Team Lead to insert/delete

### Preview Doesn’t Open
- Only previewable types (images, PDFs) open in a new tab
- Use Download for other file types

### Tasks not showing for members
- Members only see tasks assigned to them
- Check the `assigned_to` field matches the user's ID

## 📝 Future Enhancements

- Real-time notifications
- Task comments and discussions
- Advanced analytics and reporting
- Email notifications
- Calendar integration
- Export functionality (PDF, CSV)

## 🤖 AI Chatbot Notes

- The chatbot on the Tasks page uses OpenRouter with model `deepseek/deepseek-r1-0528:free`.
- Configuration lives in `components/AIChatbot.tsx`. For production, prefer using an environment variable for the API key rather than hardcoding.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

Created for the ALLOCON project management system.

---

**Need Help?** Check the Supabase documentation or create an issue in the repository.
