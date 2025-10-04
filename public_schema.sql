


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."game_status" AS ENUM (
    'setup',
    'active',
    'paused',
    'completed'
);


ALTER TYPE "public"."game_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) RETURNS TABLE("in_selected_categories" integer, "in_all_categories" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (
      SELECT COUNT(*)::INT
      FROM questions q
      WHERE q.category = ANY(p_categories)
        AND q.id NOT IN (
          SELECT question_id FROM question_usage WHERE host_id = p_host_id
        )
    ) AS in_selected_categories,
    (
      SELECT COUNT(*)::INT
      FROM questions q
      WHERE q.id NOT IN (
        SELECT question_id FROM question_usage WHERE host_id = p_host_id
      )
    ) AS in_all_categories;
END;
$$;


ALTER FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) IS 'Counts available questions for warning display (FR-007a)';



CREATE OR REPLACE FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_history;
END;
$$;


ALTER FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") IS 'Refresh game history view after game completion';



CREATE OR REPLACE FUNCTION "public"."refresh_leaderboard"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_entries;
END;
$$;


ALTER FUNCTION "public"."refresh_leaderboard"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_leaderboard"() IS 'Refresh leaderboard view (hourly or on-demand)';



CREATE OR REPLACE FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) RETURNS TABLE("question_id" "uuid", "category" "text", "question" "text", "answer_a" "text", "answer_b" "text", "answer_c" "text", "answer_d" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_available_count INT;
  v_use_all_categories BOOLEAN := false;
BEGIN
  -- Count available questions in selected categories (excluding used questions)
  SELECT COUNT(*) INTO v_available_count
  FROM questions q
  WHERE q.category = ANY(p_categories)
    AND q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    );

  -- If insufficient questions in selected categories, expand to all categories (FR-007)
  IF v_available_count < p_count THEN
    v_use_all_categories := true;

    -- Count available questions across all categories
    SELECT COUNT(*) INTO v_available_count
    FROM questions q
    WHERE q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    );
  END IF;

  -- Return random selection of questions
  RETURN QUERY
  SELECT
    q.id,
    q.category,
    q.question,
    q.a,
    q.b,
    q.c,
    q.d
  FROM questions q
  WHERE
    (
      -- Either use selected categories or all categories
      CASE
        WHEN v_use_all_categories THEN true
        ELSE q.category = ANY(p_categories)
      END
    )
    AND q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    )
  ORDER BY random()
  LIMIT p_count;
END;
$$;


ALTER FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) IS 'Selects random questions excluding those already used by host (FR-006), auto-supplements from all categories if needed (FR-007)';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."answer_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_question_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "selected_answer" character(1) NOT NULL,
    "is_correct" boolean NOT NULL,
    "answer_time_ms" integer NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "answer_submissions_selected_answer_check" CHECK (("selected_answer" = ANY (ARRAY['a'::"bpchar", 'b'::"bpchar", 'c'::"bpchar", 'd'::"bpchar"])))
);


ALTER TABLE "public"."answer_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."answer_submissions" IS 'Team answers with first-submission lock via UNIQUE constraint';



CREATE TABLE IF NOT EXISTS "public"."game_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "round_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "randomization_seed" integer NOT NULL,
    "revealed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."game_questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_questions" IS 'Question instances with randomization seed for consistent shuffling (FR-037)';



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "game_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "venue_name" "text",
    "venue_location" "text",
    "scheduled_at" timestamp with time zone,
    "status" "public"."game_status" DEFAULT 'setup'::"public"."game_status" NOT NULL,
    "num_rounds" integer NOT NULL,
    "questions_per_round" integer NOT NULL,
    "time_limit_seconds" integer,
    "min_players_per_team" integer DEFAULT 1 NOT NULL,
    "max_players_per_team" integer DEFAULT 6 NOT NULL,
    "sound_effects_enabled" boolean DEFAULT false NOT NULL,
    "current_question_index" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "games_max_players_per_team_check" CHECK ((("max_players_per_team" >= 1) AND ("max_players_per_team" <= 6))),
    CONSTRAINT "games_min_players_per_team_check" CHECK ((("min_players_per_team" >= 1) AND ("min_players_per_team" <= 6))),
    CONSTRAINT "games_num_rounds_check" CHECK (("num_rounds" > 0)),
    CONSTRAINT "games_questions_per_round_check" CHECK (("questions_per_round" > 0)),
    CONSTRAINT "games_time_limit_seconds_check" CHECK ((("time_limit_seconds" IS NULL) OR ("time_limit_seconds" > 0))),
    CONSTRAINT "valid_team_size" CHECK (("min_players_per_team" <= "max_players_per_team"))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


COMMENT ON TABLE "public"."games" IS 'Main game entity with configuration and state tracking';



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "question" "text" NOT NULL,
    "a" "text",
    "b" "text",
    "c" "text",
    "d" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "round_number" integer NOT NULL,
    "categories" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rounds_round_number_check" CHECK (("round_number" > 0))
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


COMMENT ON TABLE "public"."rounds" IS 'Round configuration with category selections per game';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'Players on teams (many-to-many relationship)';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "team_name" "text" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "cumulative_answer_time_ms" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Teams within games with score and tie-breaking time tracking';



CREATE MATERIALIZED VIEW "public"."game_history" AS
 SELECT "g"."id" AS "game_id",
    "g"."host_id",
    "g"."name" AS "game_name",
    "g"."venue_name",
    "g"."completed_at",
    "count"(DISTINCT "t"."id") AS "num_teams",
    "count"(DISTINCT "tm"."player_id") AS "num_players",
    "count"(DISTINCT "gq"."id") AS "num_questions",
    ( SELECT "t2"."team_name"
           FROM "public"."teams" "t2"
          WHERE ("t2"."game_id" = "g"."id")
          ORDER BY "t2"."score" DESC, "t2"."cumulative_answer_time_ms"
         LIMIT 1) AS "winning_team",
    "array_agg"("jsonb_build_object"('question_id', "q"."id", 'question', "q"."question", 'category', "q"."category", 'correct_answer', "q"."a") ORDER BY "gq"."display_order") AS "questions"
   FROM ((((("public"."games" "g"
     JOIN "public"."rounds" "r" ON (("r"."game_id" = "g"."id")))
     JOIN "public"."game_questions" "gq" ON (("gq"."game_id" = "g"."id")))
     JOIN "public"."questions" "q" ON (("q"."id" = "gq"."question_id")))
     LEFT JOIN "public"."teams" "t" ON (("t"."game_id" = "g"."id")))
     LEFT JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "t"."id")))
  WHERE ("g"."status" = 'completed'::"public"."game_status")
  GROUP BY "g"."id", "g"."host_id", "g"."name", "g"."venue_name", "g"."completed_at"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."game_history" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."game_history" IS 'Completed games with full details (hosts only - includes question content)';



CREATE TABLE IF NOT EXISTS "public"."hosts" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hosts" OWNER TO "postgres";


COMMENT ON TABLE "public"."hosts" IS 'Host accounts extending Supabase auth.users';



CREATE TABLE IF NOT EXISTS "public"."leaderboard_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_name" "text" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "games_played" integer NOT NULL,
    "games_won" integer NOT NULL,
    "win_rate" numeric(5,2) NOT NULL,
    "avg_score" numeric(6,2) NOT NULL,
    "accuracy" numeric(5,2) NOT NULL,
    "rank" integer NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leaderboard_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."leaderboard_cache" IS 'Aggregated player statistics per venue (refreshed after game completion)';



CREATE TABLE IF NOT EXISTS "public"."player_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "games_played" integer DEFAULT 0 NOT NULL,
    "games_won" integer DEFAULT 0 NOT NULL,
    "total_correct_answers" integer DEFAULT 0 NOT NULL,
    "total_questions_answered" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."player_profiles" IS 'Player metadata beyond auth with cached game statistics';



CREATE MATERIALIZED VIEW "public"."leaderboard_entries" AS
 SELECT "g"."venue_name",
    "pp"."id" AS "player_id",
    "pp"."display_name",
    "count"(DISTINCT "t"."game_id") AS "games_played",
    "count"(DISTINCT
        CASE
            WHEN ("t"."score" = ( SELECT "max"("t2"."score") AS "max"
               FROM "public"."teams" "t2"
              WHERE ("t2"."game_id" = "t"."game_id"))) THEN "t"."game_id"
            ELSE NULL::"uuid"
        END) AS "games_won",
    "round"(((100.0 * ("count"(DISTINCT
        CASE
            WHEN ("t"."score" = ( SELECT "max"("t2"."score") AS "max"
               FROM "public"."teams" "t2"
              WHERE ("t2"."game_id" = "t"."game_id"))) THEN "t"."game_id"
            ELSE NULL::"uuid"
        END))::numeric) / (NULLIF("count"(DISTINCT "t"."game_id"), 0))::numeric), 2) AS "win_rate",
    "round"("avg"("t"."score"), 2) AS "avg_score",
    "round"(((100.0 * ("sum"(
        CASE
            WHEN "asub"."is_correct" THEN 1
            ELSE 0
        END))::numeric) / (NULLIF("count"("asub"."id"), 0))::numeric), 2) AS "accuracy",
    "rank"() OVER (PARTITION BY "g"."venue_name" ORDER BY ("count"(DISTINCT
        CASE
            WHEN ("t"."score" = ( SELECT "max"("t2"."score") AS "max"
               FROM "public"."teams" "t2"
              WHERE ("t2"."game_id" = "t"."game_id"))) THEN "t"."game_id"
            ELSE NULL::"uuid"
        END)) DESC) AS "rank"
   FROM (((("public"."player_profiles" "pp"
     JOIN "public"."team_members" "tm" ON (("tm"."player_id" = "pp"."id")))
     JOIN "public"."teams" "t" ON (("t"."id" = "tm"."team_id")))
     JOIN "public"."games" "g" ON (("g"."id" = "t"."game_id")))
     LEFT JOIN "public"."answer_submissions" "asub" ON ((("asub"."team_id" = "t"."id") AND ("asub"."submitted_by" = "pp"."id"))))
  WHERE (("g"."status" = 'completed'::"public"."game_status") AND ("g"."venue_name" IS NOT NULL))
  GROUP BY "g"."venue_name", "pp"."id", "pp"."display_name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."leaderboard_entries" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."leaderboard_entries" IS 'Player statistics by venue (public access)';



CREATE TABLE IF NOT EXISTS "public"."question_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "game_id" "uuid" NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."question_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."question_usage" IS 'Tracks questions used by each host to prevent reuse across all games (FR-006)';



ALTER TABLE ONLY "public"."answer_submissions"
    ADD CONSTRAINT "answer_submissions_game_question_id_team_id_key" UNIQUE ("game_question_id", "team_id");



COMMENT ON CONSTRAINT "answer_submissions_game_question_id_team_id_key" ON "public"."answer_submissions" IS 'Enforces first-answer-wins: only one submission per team per question (FR-043)';



ALTER TABLE ONLY "public"."answer_submissions"
    ADD CONSTRAINT "answer_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_questions"
    ADD CONSTRAINT "game_questions_game_id_display_order_key" UNIQUE ("game_id", "display_order");



ALTER TABLE ONLY "public"."game_questions"
    ADD CONSTRAINT "game_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_game_code_key" UNIQUE ("game_code");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hosts"
    ADD CONSTRAINT "hosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_venue_name_player_id_key" UNIQUE ("venue_name", "player_id");



ALTER TABLE ONLY "public"."player_profiles"
    ADD CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_usage"
    ADD CONSTRAINT "question_usage_host_id_question_id_key" UNIQUE ("host_id", "question_id");



ALTER TABLE ONLY "public"."question_usage"
    ADD CONSTRAINT "question_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_game_id_round_number_key" UNIQUE ("game_id", "round_number");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_player_id_key" UNIQUE ("team_id", "player_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_game_id_team_name_key" UNIQUE ("game_id", "team_name");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_answer_submissions_game_question_id" ON "public"."answer_submissions" USING "btree" ("game_question_id");



CREATE INDEX "idx_answer_submissions_team_id" ON "public"."answer_submissions" USING "btree" ("team_id");



CREATE UNIQUE INDEX "idx_game_history_game_id" ON "public"."game_history" USING "btree" ("game_id");



CREATE INDEX "idx_game_questions_game_id" ON "public"."game_questions" USING "btree" ("game_id");



CREATE INDEX "idx_game_questions_round_id" ON "public"."game_questions" USING "btree" ("round_id");



CREATE INDEX "idx_games_game_code" ON "public"."games" USING "btree" ("game_code");



CREATE INDEX "idx_games_host_id" ON "public"."games" USING "btree" ("host_id");



CREATE INDEX "idx_games_status" ON "public"."games" USING "btree" ("status");



CREATE INDEX "idx_leaderboard_cache_venue_rank" ON "public"."leaderboard_cache" USING "btree" ("venue_name", "rank");



CREATE UNIQUE INDEX "idx_leaderboard_entries_venue_player" ON "public"."leaderboard_entries" USING "btree" ("venue_name", "player_id");



CREATE INDEX "idx_question_usage_host_question" ON "public"."question_usage" USING "btree" ("host_id", "question_id");



COMMENT ON INDEX "public"."idx_question_usage_host_question" IS 'Critical for performance: enables fast exclusion queries in question selection';



CREATE INDEX "idx_questions_category" ON "public"."questions" USING "btree" ("category");



CREATE INDEX "idx_questions_created_at" ON "public"."questions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_rounds_game_id" ON "public"."rounds" USING "btree" ("game_id");



CREATE INDEX "idx_team_members_player_id" ON "public"."team_members" USING "btree" ("player_id");



CREATE INDEX "idx_team_members_team_id" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "idx_teams_game_id" ON "public"."teams" USING "btree" ("game_id");



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hosts_updated_at" BEFORE UPDATE ON "public"."hosts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_player_profiles_updated_at" BEFORE UPDATE ON "public"."player_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."answer_submissions"
    ADD CONSTRAINT "answer_submissions_game_question_id_fkey" FOREIGN KEY ("game_question_id") REFERENCES "public"."game_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answer_submissions"
    ADD CONSTRAINT "answer_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."answer_submissions"
    ADD CONSTRAINT "answer_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_questions"
    ADD CONSTRAINT "game_questions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_questions"
    ADD CONSTRAINT "game_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."game_questions"
    ADD CONSTRAINT "game_questions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hosts"
    ADD CONSTRAINT "hosts_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_profiles"
    ADD CONSTRAINT "player_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_usage"
    ADD CONSTRAINT "question_usage_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_usage"
    ADD CONSTRAINT "question_usage_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_usage"
    ADD CONSTRAINT "question_usage_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can read questions" ON "public"."questions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."answer_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "answer_submissions_host_access" ON "public"."answer_submissions" FOR SELECT USING (("game_question_id" IN ( SELECT "gq"."id"
   FROM ("public"."game_questions" "gq"
     JOIN "public"."games" "g" ON (("g"."id" = "gq"."game_id")))
  WHERE ("g"."host_id" = "auth"."uid"()))));



CREATE POLICY "answer_submissions_team_access" ON "public"."answer_submissions" USING (("team_id" IN ( SELECT "team_members"."team_id"
   FROM "public"."team_members"
  WHERE ("team_members"."player_id" = "auth"."uid"()))));



ALTER TABLE "public"."game_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "game_questions_player_access" ON "public"."game_questions" FOR SELECT USING (("game_id" IN ( SELECT "t"."game_id"
   FROM ("public"."teams" "t"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "t"."id")))
  WHERE ("tm"."player_id" = "auth"."uid"()))));



COMMENT ON POLICY "game_questions_player_access" ON "public"."game_questions" IS 'Allow players to view questions for games they have joined';



CREATE POLICY "game_questions_tv_public_read" ON "public"."game_questions" FOR SELECT USING (("game_id" IN ( SELECT "games"."id"
   FROM "public"."games"
  WHERE ("games"."status" = ANY (ARRAY['active'::"public"."game_status", 'paused'::"public"."game_status", 'completed'::"public"."game_status"])))));



CREATE POLICY "game_questions_via_game_access" ON "public"."game_questions" USING (("game_id" IN ( SELECT "games"."id"
   FROM "public"."games"
  WHERE ("games"."host_id" = "auth"."uid"()))));



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "games_host_access" ON "public"."games" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "games_player_access" ON "public"."games" FOR SELECT USING (("id" IN ( SELECT "t"."game_id"
   FROM ("public"."teams" "t"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "t"."id")))
  WHERE ("tm"."player_id" = "auth"."uid"()))));



COMMENT ON POLICY "games_player_access" ON "public"."games" IS 'Allow players to view games they have joined via team membership';



CREATE POLICY "games_tv_public_read" ON "public"."games" FOR SELECT USING (("status" = ANY (ARRAY['active'::"public"."game_status", 'paused'::"public"."game_status", 'completed'::"public"."game_status"])));



ALTER TABLE "public"."hosts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hosts_own_data" ON "public"."hosts" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."leaderboard_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leaderboard_cache_public_read" ON "public"."leaderboard_cache" FOR SELECT USING (true);



ALTER TABLE "public"."player_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_profiles_own_data" ON "public"."player_profiles" USING (("id" = "auth"."uid"()));



CREATE POLICY "player_profiles_public_read" ON "public"."player_profiles" FOR SELECT USING (true);



ALTER TABLE "public"."question_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "question_usage_host_access" ON "public"."question_usage" USING (("host_id" = "auth"."uid"()));



ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rounds_via_game_access" ON "public"."rounds" USING (("game_id" IN ( SELECT "games"."id"
   FROM "public"."games"
  WHERE ("games"."host_id" = "auth"."uid"()))));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_host_access" ON "public"."team_members" FOR SELECT USING (("team_id" IN ( SELECT "t"."id"
   FROM ("public"."teams" "t"
     JOIN "public"."games" "g" ON (("g"."id" = "t"."game_id")))
  WHERE ("g"."host_id" = "auth"."uid"()))));



CREATE POLICY "team_members_own_data" ON "public"."team_members" USING (("player_id" = "auth"."uid"()));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_host_access" ON "public"."teams" USING (("game_id" IN ( SELECT "games"."id"
   FROM "public"."games"
  WHERE ("games"."host_id" = "auth"."uid"()))));



CREATE POLICY "teams_player_access" ON "public"."teams" FOR SELECT USING (("game_id" IN ( SELECT "t"."game_id"
   FROM ("public"."teams" "t"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "t"."id")))
  WHERE ("tm"."player_id" = "auth"."uid"()))));



COMMENT ON POLICY "teams_player_access" ON "public"."teams" IS 'Allow players to view teams in games they have joined';



CREATE POLICY "teams_tv_public_read" ON "public"."teams" FOR SELECT USING (("game_id" IN ( SELECT "games"."id"
   FROM "public"."games"
  WHERE ("games"."status" = ANY (ARRAY['active'::"public"."game_status", 'paused'::"public"."game_status", 'completed'::"public"."game_status"])))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_available_questions"("p_host_id" "uuid", "p_categories" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_game_history"("p_game_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."select_questions_for_host"("p_host_id" "uuid", "p_categories" "text"[], "p_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."answer_submissions" TO "anon";
GRANT ALL ON TABLE "public"."answer_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."answer_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."game_questions" TO "anon";
GRANT ALL ON TABLE "public"."game_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_questions" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."game_history" TO "anon";
GRANT ALL ON TABLE "public"."game_history" TO "authenticated";
GRANT ALL ON TABLE "public"."game_history" TO "service_role";



GRANT ALL ON TABLE "public"."hosts" TO "anon";
GRANT ALL ON TABLE "public"."hosts" TO "authenticated";
GRANT ALL ON TABLE "public"."hosts" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_cache" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_cache" TO "service_role";



GRANT ALL ON TABLE "public"."player_profiles" TO "anon";
GRANT ALL ON TABLE "public"."player_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."player_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_entries" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_entries" TO "service_role";



GRANT ALL ON TABLE "public"."question_usage" TO "anon";
GRANT ALL ON TABLE "public"."question_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."question_usage" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
