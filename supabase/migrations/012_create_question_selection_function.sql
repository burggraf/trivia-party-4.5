-- Migration: Create Postgres function for question selection with reuse prevention
-- This function handles the complex logic for FR-006 and FR-007

CREATE OR REPLACE FUNCTION select_questions_for_host(
  p_host_id UUID,
  p_categories TEXT[],
  p_count INT
)
RETURNS TABLE(
  question_id UUID,
  category TEXT,
  question TEXT,
  answer_a TEXT,
  answer_b TEXT,
  answer_c TEXT,
  answer_d TEXT
) AS $$
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
$$ LANGUAGE plpgsql;

-- Helper function to check available question count before selection
CREATE OR REPLACE FUNCTION count_available_questions(
  p_host_id UUID,
  p_categories TEXT[]
)
RETURNS TABLE(
  in_selected_categories INT,
  in_all_categories INT
) AS $$
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
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION select_questions_for_host IS 'Selects random questions excluding those already used by host (FR-006), auto-supplements from all categories if needed (FR-007)';
COMMENT ON FUNCTION count_available_questions IS 'Counts available questions for warning display (FR-007a)';