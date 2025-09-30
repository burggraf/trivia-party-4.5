# Database Seed File

This directory contains `seed.sql` which populates the `questions` table with 61,254+ trivia questions across 10 categories.

## Contents

- **Total Questions**: 61,254
- **Categories**: 10 (Science, History, Entertainment, General Knowledge, Geography, Arts & Literature, Pop Culture, Sports, Food and Drink, Technology)
- **Source**: Exported from remote Supabase production database

## Category Breakdown

| Category           | Count |
|--------------------|-------|
| Science            | 9,398 |
| History            | 9,322 |
| Entertainment      | 9,080 |
| General Knowledge  | 8,105 |
| Geography          | 6,474 |
| Arts & Literature  | 5,855 |
| Pop Culture        | 4,371 |
| Sports             | 3,468 |
| Food and Drink     | 3,332 |
| Technology         | 1,849 |

## Usage

### Automatic Seeding (with Supabase CLI)

When you run `supabase db reset`, the seed file is automatically applied after migrations:

```bash
npx supabase db reset
```

### Manual Seeding

To manually apply the seed file to a running database:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql
```

### Verify Seeding

Check that questions were loaded:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT COUNT(*) FROM questions"
```

## Regenerating the Seed File

If you need to update the seed file from the remote database:

```bash
# Dump all data from linked project
npx supabase db dump --linked --data-only --use-copy -f /tmp/remote_dump.sql

# Extract questions table data (lines 172-61441 in current dump)
sed -n '172,61441p' /tmp/remote_dump.sql > supabase/seed.sql

# Verify the seed file
wc -l supabase/seed.sql
head -5 supabase/seed.sql
```

## File Format

The seed file uses PostgreSQL COPY format:

```sql
COPY "public"."questions" ("id", "category", "question", "a", "b", "c", "d", "metadata", "created_at", "updated_at") FROM stdin;
[tab-delimited data rows]
\.
```

## Notes

- Each question has 4 answer choices (a, b, c, d) where 'a' is always the correct answer
- Questions include UUIDs, categories, question text, answers, metadata (JSON), and timestamps
- The seed file is **not** included in migrations because the questions table schema is defined in `000_create_questions.sql`
- Seeding happens **after** all migrations are applied