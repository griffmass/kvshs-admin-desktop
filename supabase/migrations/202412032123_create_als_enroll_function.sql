CREATE OR REPLACE FUNCTION enroll_als_student_automatically(p_lrn text)
RETURNS json AS $$
DECLARE
    v_grade_level text;
    v_strand text;
    v_sex text;
    v_section char(1);
    v_total_count int;
    v_male_count int;
    v_female_count int;
BEGIN
    -- Fetch student details from ALS table
    SELECT "gradeLevel", "strand", "sex" INTO v_grade_level, v_strand, v_sex
    FROM "ALS"
    WHERE lrn = p_lrn;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ALS Student with LRN % not found', p_lrn;
    END IF;

    -- Loop through sections A to Z
    FOR v_section IN SELECT chr(i) FROM generate_series(65, 90) AS t(i) LOOP
        -- Count total students in section
        SELECT COUNT(*) INTO v_total_count
        FROM "ALS"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled';

        -- Count male students in section
        SELECT COUNT(*) INTO v_male_count
        FROM "ALS"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled' AND "sex" = 'Male';

        -- Count female students in section
        SELECT COUNT(*) INTO v_female_count
        FROM "ALS"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled' AND "sex" = 'Female';

        -- Check constraints: max 45 total, with 23 male or 23 female priority
        IF v_total_count < 45 THEN
            IF (v_sex = 'Male' AND v_male_count < 23) OR (v_sex = 'Female' AND v_female_count < 23) THEN
                -- Update student with section assignment
                UPDATE "ALS"
                SET "section" = v_section, "enrollment_status" = 'Enrolled', "approved_at" = NOW()
                WHERE lrn = p_lrn;

                -- Return success
                RETURN json_build_object('success', true, 'section', v_section);
            END IF;
        END IF;
    END LOOP;

    -- If no section found
    RAISE EXCEPTION 'All ALS sections are full (Max 22/23 gender split reached)';
END;
$$ LANGUAGE plpgsql;