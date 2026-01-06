# Supabase Storage Setup Guide

Follow these steps to set up file storage for the Resources page:

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `bazljaxdppuyfqdpjmst`
3. Click on **Storage** in the left sidebar
4. Click **Create a new bucket** button
5. Enter the bucket name: `resources`
6. **Public bucket**: Toggle ON (this allows files to be accessible via public URLs)
7. Click **Create bucket**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. In the Storage section, click on the **resources** bucket
2. Click on the **Policies** tab
3. Click **New Policy**

### Policy 1: Allow All to Read (SELECT)
- **Policy name**: `Public read access`
- **Allowed operation**: SELECT
- **Target roles**: `public`
- **USING expression**: `true`
- Click **Save**

### Policy 2: Allow Team Leads to Upload (INSERT)
- **Policy name**: `Team leads can upload`
- **Allowed operation**: INSERT
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'team_lead'::text))))
```
- Click **Save**

### Policy 3: Allow Team Leads to Delete
- **Policy name**: `Team leads can delete`
- **Allowed operation**: DELETE
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'team_lead'::text))))
```
- Click **Save**

## Step 3: Update Database Schema

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the updated SQL schema from `supabase-schema.sql`
3. This will create the `resources` table and its policies

OR run this SQL directly:

```sql
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

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "All users can view resources" ON resources FOR SELECT USING (true);

CREATE POLICY "Team leads can insert resources" ON resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
);

CREATE POLICY "Team leads can update resources" ON resources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
);

CREATE POLICY "Team leads can delete resources" ON resources FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team_lead')
);
```

## Step 4: Test the Upload

1. Make sure you're logged in as a **Team Lead**
2. Go to the **Resources** page
3. Click **Upload Resource**
4. Fill in:
   - **Title**: Test Document
   - **Description**: This is a test file
   - **File**: Choose any PDF, image, or document file
5. Click **Upload Resource**
6. The file should appear in the resources list
7. Test the **Download** and **Preview** buttons

## Troubleshooting

### "Error: new row violates row-level security policy"
- Make sure you're logged in as a team lead
- Verify the storage bucket policies are set up correctly
- Check that the `users` table has your account with `role = 'team_lead'`

### "Failed to upload file"
- Ensure the storage bucket exists and is named exactly `resources`
- Check that the bucket is set to **public**
- Verify storage policies are created

### Files won't download
- Check browser console for errors
- Ensure the bucket is public
- Verify the file_path is correct in the database

### Preview doesn't work
- Some file types can't be previewed in browser (e.g., .docx, .zip)
- PDFs and images should open in a new tab
- Try downloading the file instead

## File Size Limits

By default, Supabase allows files up to 50MB on the free tier. To upload larger files:
1. Go to **Storage** → **Settings**
2. Adjust **Maximum file size** (paid plans only)

## Supported File Types

The app supports any file type, but displays appropriate icons for:
- 📄 PDFs (FiFileText icon)
- 🖼️ Images (FiImage icon)
- 📁 Other files (FiFile icon)

## Security Notes

- Only team leads can upload, delete, or update resources
- All authenticated users can view and download resources
- Files are stored with unique names to prevent conflicts
- File metadata is stored in the database for tracking

---

Your resources system is now ready to use! Team leads can upload files, and all team members can download them.
