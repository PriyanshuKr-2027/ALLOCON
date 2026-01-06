# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: ChatBot RBAC
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
4. Wait for project creation

#### Run Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy **ALL** content from `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **RUN** or press `Ctrl+Enter`
6. You should see "Success. No rows returned"

#### Get API Credentials
1. Go to **Settings** (gear icon) > **API**
2. Copy these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public key** (long string starting with eyJ...)

### 3. Configure Environment

Create `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the values with your actual Supabase credentials!

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create Your First Account

1. Click **Sign Up**
2. Enter your details:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 6 characters)
3. Click **Create Account**

### 6. Make Yourself Team Lead

Since the first user needs to be a Team Lead:

1. Go to **Supabase Dashboard** > **Table Editor**
2. Click on **users** table
3. Find your user record
4. Click on the `role` field
5. Change from `member` to `team_lead`
6. Save changes

### 7. Log In

1. Go back to the app
2. Click **Sign In**
3. Enter your email and password
4. You're now logged in as Team Lead!

## ✅ Verify Setup

After logging in, you should see:
- ✅ Sidebar with all menu items
- ✅ "Welcome back" message on Overview page
- ✅ Stats showing 0/0/0 (normal for new setup)
- ✅ Access to all pages (Team Lead permissions)

## 🎯 Next Steps

### Add a Milestone
1. Go to **Milestones** page
2. Click **Add Milestone**
3. Fill in:
   - Title: "Sprint 1"
   - Duration: "2 weeks"
   - Description: "Initial development phase"
4. Click **Create Milestone**

### Add a Task
1. Go to **Tasks** page
2. Click **Add Task**
3. Fill in:
   - Title: "Set up database"
   - Description: "Configure Supabase tables"
   - Milestone: Select "Sprint 1"
   - Assign To: (select yourself)
4. Click **Create Task**

### Invite Team Members
1. Share your app URL with team members
2. They sign up normally
3. Go to **Team** page
4. You'll see them listed
5. Toggle their status as needed

## 🐛 Common Issues

### Issue: "Invalid login credentials"
**Solution:** 
- Check email/password are correct
- Wait 1-2 minutes after signup for email confirmation (if enabled)

### Issue: "User not found in database"
**Solution:**
- Ensure database schema was executed correctly
- Check that `users` table exists in Supabase

### Issue: "RLS policy violation"
**Solution:**
- Verify all RLS policies were created
- Make sure you ran the complete SQL schema

### Issue: Environment variables not working
**Solution:**
- File must be named `.env.local` (not .env)
- Restart dev server after creating .env.local
- Check for typos in variable names

## 📞 Need Help?

1. Check the main README.md
2. Review Supabase documentation
3. Verify all SQL policies are in place
4. Check browser console for errors

---

Happy coding! 🚀
