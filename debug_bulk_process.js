// Debug script to simulate the exact bulk enrollment process
function debugBulkProcess() {
  console.log("=== Simulating Bulk Enrollment Process ===\n");

  // Simulate the exact scenario: 28 males and 1 female
  const students = [];
  for (let i = 1; i <= 28; i++) {
    students.push({ lrn: `M${i}`, sex: "Male" });
  }
  students.push({ lrn: "F1", sex: "Female" });

  console.log(`Enrolling ${students.length} students: 28 males, 1 female`);

  // Simulate sections
  const sections = [{ section_name: "A", males: 0, females: 0 }];

  // Process students in the order they appear in the array
  for (const student of students) {
    let assigned = false;

    // Try to assign to existing sections
    for (const section of sections) {
      if (canAddStudentToSection(section.males, section.females, student.sex)) {
        if (student.sex === "Male") {
          section.males++;
        } else {
          section.females++;
        }
        console.log(
          `Student ${student.lrn} (${student.sex}): Assigned to Section ${section.section_name} (M: ${section.males}, F: ${section.females})`
        );
        assigned = true;
        break;
      }
    }

    // If not assigned to existing section, create new section
    if (!assigned) {
      const newSectionName = String.fromCharCode(65 + sections.length); // A, B, C, etc.
      sections.push({
        section_name: newSectionName,
        males: student.sex === "Male" ? 1 : 0,
        females: student.sex === "Female" ? 1 : 0,
      });
      console.log(
        `Student ${student.lrn} (${student.sex}): Assigned to NEW Section ${newSectionName} (M: ${sections[sections.length - 1].males}, F: ${sections[sections.length - 1].females})`
      );
    }
  }

  // Show final results
  console.log("\n=== Final Results ===");
  sections.forEach((section) => {
    console.log(
      `Section ${section.section_name}: ${section.males} males, ${section.females} females`
    );
  });

  // Test different processing orders
  console.log("\n=== Testing Different Processing Orders ===");

  // Test 1: Female first
  console.log("\nTest 1: Female processed first");
  simulateEnrollment([
    { lrn: "F1", sex: "Female" },
    ...Array(28)
      .fill(0)
      .map((_, i) => ({ lrn: `M${i + 1}`, sex: "Male" })),
  ]);

  // Test 2: Female in the middle
  console.log("\nTest 2: Female processed in the middle");
  const middleOrder = [];
  for (let i = 1; i <= 14; i++) {
    middleOrder.push({ lrn: `M${i}`, sex: "Male" });
  }
  middleOrder.push({ lrn: "F1", sex: "Female" });
  for (let i = 15; i <= 28; i++) {
    middleOrder.push({ lrn: `M${i}`, sex: "Male" });
  }
  simulateEnrollment(middleOrder);

  // Test 3: Female last
  console.log("\nTest 3: Female processed last");
  simulateEnrollment([
    ...Array(28)
      .fill(0)
      .map((_, i) => ({ lrn: `M${i + 1}`, sex: "Male" })),
    { lrn: "F1", sex: "Female" },
  ]);
}

function simulateEnrollment(students) {
  const sections = [{ section_name: "A", males: 0, females: 0 }];

  for (const student of students) {
    let assigned = false;

    for (const section of sections) {
      if (canAddStudentToSection(section.males, section.females, student.sex)) {
        if (student.sex === "Male") {
          section.males++;
        } else {
          section.females++;
        }
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const newSectionName = String.fromCharCode(65 + sections.length);
      sections.push({
        section_name: newSectionName,
        males: student.sex === "Male" ? 1 : 0,
        females: student.sex === "Female" ? 1 : 0,
      });
    }
  }

  sections.forEach((section) => {
    console.log(
      `Section ${section.section_name}: ${section.males} males, ${section.females} females`
    );
  });
}

function canAddStudentToSection(males, females, studentSex) {
  const total = males + females;

  // Check if section is already full (45 students)
  if (total >= 45) {
    return false;
  }

  // Apply gender distribution rules
  if (studentSex === "Male") {
    // If adding male: max 23 males
    if (males >= 23) {
      return false;
    }
    // If we're adding a male that would make it 23, check that females are <= 22
    if (males + 1 === 23 && females > 22) {
      return false;
    }
  } else if (studentSex === "Female") {
    // If adding female: max 22 females
    if (females >= 22) {
      return false;
    }
    // If we're adding a female that would make it 22, check that males are <= 23
    if (females + 1 === 22 && males > 23) {
      return false;
    }
  }

  return true;
}

// Run the debug
debugBulkProcess();
