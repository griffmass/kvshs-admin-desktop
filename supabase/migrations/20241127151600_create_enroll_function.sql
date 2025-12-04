CREATE OR REPLACE FUNCTION enroll_student_automatically(p_lrn text)
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
    -- Fetch student details
    SELECT "gradeLevel", "strand", "sex" INTO v_grade_level, v_strand, v_sex
    FROM "NewStudents"
    WHERE lrn = p_lrn;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with LRN % not found', p_lrn;
    END IF;

    -- Loop through sections A to Z
    FOR v_section IN SELECT chr(i) FROM generate_series(65, 90) AS t(i) LOOP
        -- Count total
        SELECT COUNT(*) INTO v_total_count
        FROM "NewStudents"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled';

        -- Count male
        SELECT COUNT(*) INTO v_male_count
        FROM "NewStudents"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled' AND "sex" = 'Male';

        -- Count female
        SELECT COUNT(*) INTO v_female_count
        FROM "NewStudents"
        WHERE "gradeLevel" = v_grade_level AND "strand" = v_strand AND "section" = v_section AND "enrollment_status" = 'Enrolled' AND "sex" = 'Female';

        -- Check constraints
        IF v_total_count < 45 THEN
            IF (v_sex = 'Male' AND v_male_count < 23) OR (v_sex = 'Female' AND v_female_count < 23) THEN
                -- Update student
                UPDATE "NewStudents"
                SET "section" = v_section, "enrollment_status" = 'Enrolled', "approved_at" = NOW()
                WHERE lrn = p_lrn;

                -- Return success
                RETURN json_build_object('success', true, 'section', v_section);
            END IF;
        END IF;
    END LOOP;

    -- If no section found
    RAISE EXCEPTION 'All sections are full (Max 22/23 gender split reached)';
END;
$$ LANGUAGE plpgsql;