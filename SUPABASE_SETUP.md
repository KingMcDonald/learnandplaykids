# Supabase Setup Guide - Learn & Play Kids

## Quick Start

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project name: `learn-and-play-kids`
5. Enter a strong database password
6. Select region closest to your users
7. Click "Create new project" (wait 5-10 minutes)

### 2. Get API Credentials
Once project is created:
1. Go to **Settings → API** (in left sidebar)
2. Copy and save:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Public Key** → `SUPABASE_KEY`
3. Update [supabase.js](supabase.js) with these values:

```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_KEY = "your-anon-public-key";
```

### 3. Create Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste entire contents of [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql)
3. Click "Run" button
4. Verify tables appear in **Table Editor**

### 4. Enable RLS Policies (Optional but Recommended)
Policies are created automatically by the SQL script. To verify:
1. Go to **Authentication → Policies**
2. Check each table has policies for SELECT, INSERT, UPDATE, DELETE
3. Currently set to "Allow all" - restrict in production

### 5. Configure CORS (if needed)
1. Go to **Settings → API**
2. Scroll to "CORS Allowed Origins"
3. Add your domain: `https://yourdomain.com` (production)
4. Keep `http://localhost:*` for development

## Database Schema

### Tables Created

#### 1. `users` Table
Main user profile table:
```
- id (TEXT, PRIMARY KEY) - Unique identifier
- name (VARCHAR) - Player name
- total_score (INTEGER) - Cumulative score
- accuracy (DECIMAL) - Accuracy percentage (0-100)
- activities (INTEGER) - Activities started
- completed_activities (INTEGER) - Activities completed
- response_time (INTEGER) - Average response time (ms)
- session_count (INTEGER) - Number of sessions
- device_count (INTEGER) - Number of devices used
- last_login (TIMESTAMP) - Last active timestamp
- created_at (TIMESTAMP) - Account creation time
- updated_at (TIMESTAMP) - Last profile update
```

**Indexes**: `name`, `created_at`, `last_login`

#### 2. `session_data` Table
Detailed gameplay analytics:
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY) - Links to users.id
- activity_name (VARCHAR) - Activity name
- question_number (INTEGER) - Question index
- is_correct (BOOLEAN) - Answer correctness
- points_earned (INTEGER) - Points for this attempt
- difficulty (VARCHAR) - Question difficulty level
- response_time (INTEGER) - Time taken (ms)
- attempt_number (INTEGER) - Attempt count
- timestamp (TIMESTAMP) - When attempt was made
```

**Index**: `user_id` for fast filtering

#### 3. `activity_progress` Table
Track progress per activity:
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- activity_name (VARCHAR) - Activity identifier
- completed (BOOLEAN) - Completion status
- score (INTEGER) - Activity score
- accuracy (DECIMAL) - Activity accuracy
- plant_stage (INTEGER) - Plant growth stage
- session_count (INTEGER) - Sessions for activity
- timestamp (TIMESTAMP) - Last activity
```

**Index**: `user_id`

#### 4. `learning_curve` Table
Track learning progress over time:
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- question_number (INTEGER) - Question index
- accuracy (DECIMAL) - Accuracy for this question
- timestamp (TIMESTAMP) - When tracked
```

**Index**: `user_id`

### Indexes for Performance
All tables have strategic indexes for fast queries:
- User lookups by `id`, `name`, `created_at`
- Session queries by `user_id`
- Activity queries by `user_id`
- Learning data queries by `user_id`

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- **SELECT**: All users can read
- **INSERT**: All users can insert
- **UPDATE**: All users can update (restrict in production)
- **DELETE**: All users can delete (restrict in production)

**For production**, replace policies with user-specific access:
```sql
-- Example: Only own data
CREATE POLICY "Users can only access own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);
```

## API Integration in Code

### Save User Progress
```javascript
CloudSyncManager.saveUser(userId, userName, gameData)
```
- Creates or updates user profile
- Stores session data automatically
- Triggers on game save (every 30 seconds)

### Load User Data
```javascript
CloudSyncManager.getUser(userId)
```
- Retrieves latest user profile
- Returns null if user doesn't exist

### Get All Users (Admin)
```javascript
CloudSyncManager.getAllUsers()
```
- Returns all users sorted by score
- Used in admin dashboard

### Sync to Cloud (Background)
```javascript
CloudSyncManager.syncToCloud(userId, userName, gameData)
```
- Non-blocking background sync
- Fires on game exit or periodic interval

## Troubleshooting

### 400 Bad Request Error
**Cause**: Column name mismatch (camelCase vs snake_case)

**Solution**: Ensure all queries use snake_case:
- `userId` → `id`
- `totalScore` → `total_score`
- `createdAt` → `created_at`
- `lastLogin` → `last_login`

### 404 Not Found
**Cause**: Table doesn't exist

**Verify**:
- SQL script was run completely
- Table exists in "Table Editor" tab
- Table names match exactly (case-sensitive)

### 403 Unauthorized
**Cause**: API key is invalid or RLS policies deny access

**Fix**:
- Double-check `SUPABASE_KEY` value
- Check RLS policies allow SELECT/INSERT/UPDATE
- Ensure `Authorization` header is set

### Connection Timeout
**Cause**: Network issue or invalid domain

**Fix**:
- Check internet connection
- Verify `SUPABASE_URL` has no typos
- Test: `curl https://your-url.supabase.co`

### Service Worker Cache Issues
**Cause**: Response body already consumed

**Solution**: Already fixed in [service-worker.js](service-worker.js) - clones response before caching

## Production Checklist

- [ ] Change `SUPABASE_KEY` to restricted anon key (Settings → API)
- [ ] Enable authentication (optional but recommended)
- [ ] Update RLS policies to restrict user access
- [ ] Set CORS origins to production domain only
- [ ] Enable database backups
- [ ] Configure error logging (Sentry, Logrocket)
- [ ] Test offline functionality thoroughly
- [ ] Test sync on slow connections (Throttle in DevTools)

## Monitoring & Analytics

### Check Active Users
```sql
SELECT COUNT(*) as active_users, COUNT(DISTINCT DATE(last_login))
FROM users
WHERE last_login > NOW() - INTERVAL '24 hours';
```

### Top Performers
```sql
SELECT name, total_score, accuracy, last_login
FROM users
ORDER BY total_score DESC
LIMIT 10;
```

### Session Count by Activity
```sql
SELECT activity_name, COUNT(*) as sessions
FROM session_data
GROUP BY activity_name
ORDER BY sessions DESC;
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/rest/v1/users?select=*` | Fetch all users |
| GET | `/rest/v1/users?select=*&id=eq.{id}` | Fetch specific user |
| POST | `/rest/v1/users` | Create new user |
| PATCH | `/rest/v1/users?id=eq.{id}` | Update user data |
| POST | `/rest/v1/session_data` | Save session data |
| DELETE | `/rest/v1/session_data?user_id=eq.{id}` | Delete old sessions |

## Database Backup & Restore

### Automatic Backups
Supabase provides daily backups (Pro plan and above).

### Manual Backup
1. Go to **Settings → Database → Backups**
2. Click "Back up now"
3. Download backup file

### Restore from Backup
1. Create new project or reset existing database
2. Run `SUPABASE_SETUP.sql` in SQL Editor
3. Import backup data if available

## Performance Tips

1. **Pagination**: Use `limit` and `offset` for large queries
```javascript
const users = await supabaseClient.get('users', {
  order: 'created_at.desc',
  limit: 50,
  offset: 0
});
```

2. **Caching**: Implement client-side caching to reduce API calls
```javascript
const userCache = new Map();
if (userCache.has(userId)) {
  return userCache.get(userId);
}
```

3. **Indexes**: Always query by indexed columns (`id`, `user_id`, `created_at`)

4. **Batch Operations**: Insert multiple records in one query
```javascript
// Instead of loop, use multiple records
await supabaseClient.insert('session_data', [
  { user_id: '1', is_correct: true, ... },
  { user_id: '1', is_correct: false, ... }
]);
```

## Security Notes

- ✅ RLS policies protect data access
- ✅ Public key is client-facing (data is still secure with RLS)
- ⚠️ Never expose admin/service role key in frontend code
- ⚠️ Restrict RLS policies before production
- ✅ HTTPS enforced for all connections
- ✅ API calls include authentication headers

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Support**: Open an issue on GitHub
