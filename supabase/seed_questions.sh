#!/bin/bash
# Export questions from remote Supabase to local seed file

echo "Dumping questions table from linked project..."
npx supabase db dump \
  --data-only \
  --linked \
  --use-copy \
  --db-url "$(npx supabase status --linked 2>&1 | grep 'DB URL' | awk '{print $NF}')" \
  -f supabase/seeds/questions.sql

echo "Questions seeded to supabase/seeds/questions.sql"
