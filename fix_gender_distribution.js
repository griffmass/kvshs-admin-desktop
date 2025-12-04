// Script to fix existing gender distribution issues
// This script will identify and fix sections that have more than the allowed gender distribution

const { supabase } = require("./src/lib/supabase");

async function fixGenderDistribution() {
  try {
    console.log("Starting gender distribution fix...");

    // Get all sections
    const { data: sections, error: sectionsError } = await supabase
      .from("sections")
      .select("*");

    if (sectionsError) {
      throw sectionsError;
    }

    console.log(`Found ${sections.length} sections to check`);

    for (const section of sections) {
      // Get all students in this section
      const { data: students, error: studentsError } = await supabase
        .from("NewStudents")
        .select("*")
        .eq("section", section.section_name)
        .eq("strand", section.strand)
        .eq("gradeLevel", section.year_level.toString())
        .eq("enrollment_status", "Enrolled");

      if (studentsError) {
        console.error(
          `Error getting students for section ${section.section_name}:`,
          studentsError
        );
        continue;
      }

      const males = students.filter((s) => s.sex === "Male").length;
      const females = students.filter((s) => s.sex === "Female").length;
      const total = males + females;

      console.log(
        `Section ${section.section_name}: ${males} males, ${females} females, ${total} total`
      );

      // Check for violations
      if (males > 23) {
        console.log(
          `❌ VIOLATION: Section ${section.section_name} has ${males} males (max 23)`
        );
        // Find excess males (more than 23)
        const excessMales = males - 23;
        console.log(`   Need to remove ${excessMales} male students`);

        // Get male students to potentially move
        const maleStudents = students.filter((s) => s.sex === "Male");

        // For now, just log them - in a real scenario, you would:
        // 1. Create new sections if needed
        // 2. Move excess students to other sections
        // 3. Or set their section to null for manual review
        console.log(
          `   Male students that could be moved: ${maleStudents
            .slice(0, excessMales)
            .map((s) => s.lrn)
            .join(", ")}`
        );
      }

      if (females > 22) {
        console.log(
          `❌ VIOLATION: Section ${section.section_name} has ${females} females (max 22)`
        );
        // Find excess females (more than 22)
        const excessFemales = females - 22;
        console.log(`   Need to remove ${excessFemales} female students`);

        // Get female students to potentially move
        const femaleStudents = students.filter((s) => s.sex === "Female");
        console.log(
          `   Female students that could be moved: ${femaleStudents
            .slice(0, excessFemales)
            .map((s) => s.lrn)
            .join(", ")}`
        );
      }

      if (total > 45) {
        console.log(
          `❌ VIOLATION: Section ${section.section_name} has ${total} students (max 45)`
        );
        const excessStudents = total - 45;
        console.log(`   Need to remove ${excessStudents} students total`);
      }
    }

    console.log("Gender distribution check completed.");
  } catch (error) {
    console.error("Error in gender distribution fix:", error);
  }
}

// Run the fix
fixGenderDistribution();
