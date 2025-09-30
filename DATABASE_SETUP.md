# Database Setup Guide

This document provides instructions for setting up the Supabase database for the Multi-User Trivia Party Application.

## Prerequisites

- Supabase account (https://supabase.com)
- Supabase CLI installed (`npm install -D supabase`)
- PostgreSQL 15+ (for local development)

---

## Local Development Setup

### Option 1: Using Supabase CLI (Recommended)

1. **Initialize Supabase** (if not already done):
   ```bash
   npx supabase init
   ```

2. **Start local Supabase instance**:
   ```bash
   npx supabase start
   ```

   This will start Docker containers for:
   - PostgreSQL database (port 54322)
   - Supabase Studio (port 54323)
   - Supabase API (port 54321)

3. **Apply migrations**:
   ```bash
   npx supabase db reset
   ```

   Or apply manually:
   ```bash
   npx supabase migration up
   ```

4. **Generate TypeScript types**:
   ```bash
   npx supabase gen types typescript --local > types/database.types.ts
   ```

5. **Get local credentials**:
   ```bash
   npx supabase status
   ```

   Copy the connection details to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-status>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-status>
   ```

### Option 2: Using Existing Supabase Instance

If you have a running Supabase instance (e.g., from another project):

1. **Check running instances**:
   ```bash
   docker ps | grep supabase
   ```

2. **Connect to database**:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```

3. **Run migrations manually**:
   ```bash
   for file in supabase/migrations/*.sql; do
     psql postgresql://postgres:postgres@localhost:54322/postgres -f "$file"
   done
   ```

---

## Production Setup (Supabase Cloud)

### 1. Create Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose organization and project name
4. Select region closest to your users
5. Generate a strong database password (save it securely)
6. Click "Create new project"

### 2. Apply Migrations

**Option A: Via Supabase Dashboard**

1. Go to SQL Editor in Supabase Dashboard
2. Copy-paste each migration file content in order:
   - `001_create_hosts.sql`
   - `002_create_games.sql`
   - `003_create_rounds.sql`
   - `004_create_game_questions.sql`
   - `005_create_teams.sql`
   - `006_create_team_members.sql`
   - `007_create_answer_submissions.sql`
   - `008_create_question_usage.sql`
   - `009_create_player_profiles.sql`
   - `010_create_leaderboard_cache.sql`
   - `011_create_materialized_views.sql`
   - `012_create_question_selection_function.sql`
3. Run each migration

**Option B: Via Supabase CLI**

1. Link your local project to remote:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

2. Push migrations:
   ```bash
   npx supabase db push
   ```

### 3. Create Questions Table (Required)

The application requires a `questions` table with 61,000+ trivia questions. This table is **not created by migrations** as it's assumed to exist.

**Schema**:
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  a TEXT NOT NULL,  -- CORRECT ANSWER (always first)
  b TEXT NOT NULL,  -- Wrong answer
  c TEXT NOT NULL,  -- Wrong answer
  d TEXT NOT NULL,  -- Wrong answer
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
```

**Loading Question Data**:

1. Export questions from your source (CSV, JSON, SQL dump)
2. Import via Supabase Dashboard or CLI:
   ```bash
   psql "$DATABASE_URL" < questions_data.sql
   ```

Or use the Table Editor in Supabase Dashboard to manually add questions.

### 4. Configure Environment Variables

1. Get API keys from Supabase Dashboard:
   - Settings → API
   - Copy `anon` key and `service_role` key

2. Create `.env.local` in project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

3. Add to `.env.example` (without actual values):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 5. Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

---

## Database Schema Overview

### Tables (11)

1. **hosts** - Host accounts extending Supabase auth.users
2. **games** - Main game entity with configuration
3. **rounds** - Round configuration per game
4. **game_questions** - Question instances with randomization seeds
5. **teams** - Teams within games
6. **team_members** - Players on teams (many-to-many)
7. **answer_submissions** - Team answers with first-submission lock
8. **question_usage** - Tracks used questions per host (reuse prevention)
9. **player_profiles** - Player metadata and statistics
10. **leaderboard_cache** - Aggregated stats per venue
11. **questions** - Trivia questions (pre-existing, 61k+ rows)

### Materialized Views (2)

- **game_history** - Completed games with full details (for hosts)
- **leaderboard_entries** - Player statistics by venue

### Functions (2)

- **select_questions_for_host()** - Question selection with reuse prevention
- **count_available_questions()** - Counts available questions for warnings

---

## Verification Steps

After applying migrations, verify the setup:

### 1. Check Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output: 11 tables + 2 views

### 2. Check RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected: ~20 RLS policies across all tables

### 3. Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
```

Expected: `select_questions_for_host`, `count_available_questions`, `refresh_game_history`, `refresh_leaderboard`

### 4. Check Indexes

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
```

Expected: ~15 indexes including `idx_question_usage_host_question` (critical for performance)

---

## Troubleshooting

### Port Already in Use

If you see "port is already allocated" when starting Supabase:

```bash
# Stop existing instance
npx supabase stop

# Or configure different ports in supabase/config.toml
[api]
port = 54321

[db]
port = 54322
```

### Migration Fails

If a migration fails:

1. Check error message for specific issue
2. Manually fix the migration file
3. Reset and retry:
   ```bash
   npx supabase db reset
   ```

### RLS Errors

If you get "permission denied" errors:

1. Check RLS policies are created
2. Verify `auth.uid()` returns correct user ID
3. Test with service role key (bypasses RLS):
   ```typescript
   const supabase = createClient(url, serviceRoleKey)
   ```

### Questions Table Missing

The application expects a pre-existing `questions` table. If missing:

1. Create the table (see schema above)
2. Load question data from your source
3. Verify data with: `SELECT COUNT(*) FROM questions;`

---

## Next Steps

After successful database setup:

1. ✅ Database migrations applied
2. ✅ TypeScript types generated
3. ⏭️ Test database connection in application
4. ⏭️ Create first host account
5. ⏭️ Test creating a game

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**For Support**: See IMPLEMENTATION_PROGRESS.md