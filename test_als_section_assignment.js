/**
 * Test script for ALS Student Section Assignment Function
 *
 * This script tests the logic of the SQL function without requiring a database connection
 * by simulating the function's behavior with sample data.
 */

// Mock data representing ALS students
const mockALSStudents = [
  {
    lrn: "123456789012",
    fname: "John",
    lname: "Doe",
    mname: "Smith",
    strand: "ABM",
    gradeLevel: "11",
    sex: "Male",
    section: null,
    enrollment_status: "Enrolled",
  },
  {
    lrn: "234567890123",
    fname: "Jane",
    lname: "Smith",
    mname: "Johnson",
    strand: "HUMSS",
    gradeLevel: "12",
    sex: "Female",
    section: null,
    enrollment_status: "Enrolled",
  },
  {
    lrn: "345678901234",
    fname: "Robert",
    lname: "Brown",
    mname: "Williams",
    strand: "TVL-ICT",
    gradeLevel: "11",
    sex: "Male",
    section: null,
    enrollment_status: "Enrolled",
  },
  {
    lrn: "456789012345",
    fname: "Emily",
    lname: "Davis",
    mname: "Wilson",
    strand: "ABM",
    gradeLevel: "12",
    sex: "Female",
    section: null,
    enrollment_status: "Enrolled",
  },
  {
    lrn: "567890123456",
    fname: "Michael",
    lname: "Johnson",
    mname: "Taylor",
    strand: "HUMSS",
    gradeLevel: "11",
    sex: "Male",
    section: null,
    enrollment_status: "Enrolled",
  },
];

// Mock data representing existing sections
const mockSections = [
  {
    section_id: 1,
    section_name: "ABM-11-A",
    strand: "ABM",
    grade_level: "11",
    capacity: 30,
    current_students: 15,
  },
  {
    section_id: 2,
    section_name: "ABM-11-B",
    strand: "ABM",
    grade_level: "11",
    capacity: 30,
    current_students: 20,
  },
  {
    section_id: 3,
    section_name: "ABM-12-A",
    strand: "ABM",
    grade_level: "12",
    capacity: 30,
    current_students: 10,
  },
  {
    section_id: 4,
    section_name: "HUMSS-11-A",
    strand: "HUMSS",
    grade_level: "11",
    capacity: 30,
    current_students: 18,
  },
  {
    section_id: 5,
    section_name: "HUMSS-12-A",
    strand: "HUMSS",
    grade_level: "12",
    capacity: 30,
    current_students: 22,
  },
  {
    section_id: 6,
    section_name: "TVL-ICT-11-A",
    strand: "TVL-ICT",
    grade_level: "11",
    capacity: 30,
    current_students: 12,
  },
];

/**
 * Simulates the SQL function logic for assigning sections to ALS students
 */
function assignALSStudentSections() {
  console.log("Starting ALS student section assignment...");

  // Filter enrolled ALS students without sections
  const studentsNeedingSections = mockALSStudents.filter(
    (student) =>
      student.enrollment_status === "Enrolled" && student.section === null
  );

  console.log(
    `Found ${studentsNeedingSections.length} ALS students needing section assignment`
  );

  if (studentsNeedingSections.length === 0) {
    console.log("No ALS students need section assignment");
    return [];
  }

  // Group students by strand and grade level
  const studentsByStrandAndGrade = {};

  studentsNeedingSections.forEach((student) => {
    const key = `${student.strand}-${student.gradeLevel}`;
    if (!studentsByStrandAndGrade[key]) {
      studentsByStrandAndGrade[key] = [];
    }
    studentsByStrandAndGrade[key].push(student);
  });

  // Sort students alphabetically by last name, first name, middle name
  Object.keys(studentsByStrandAndGrade).forEach((key) => {
    studentsByStrandAndGrade[key].sort((a, b) => {
      const nameA = `${a.lname}, ${a.fname} ${a.mname}`.toLowerCase();
      const nameB = `${b.lname}, ${b.fname} ${b.mname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });

  // Find available sections for each strand/grade combination
  const availableSections = {};

  mockSections.forEach((section) => {
    const key = `${section.strand}-${section.grade_level}`;
    if (!availableSections[key]) {
      availableSections[key] = [];
    }
    availableSections[key].push(section);
  });

  // Sort sections by current students count (ascending) to fill less populated sections first
  Object.keys(availableSections).forEach((key) => {
    availableSections[key].sort(
      (a, b) => a.current_students - b.current_students
    );
  });

  // Assign students to sections
  const assignments = [];
  let studentIndex = 0;

  Object.keys(studentsByStrandAndGrade).forEach((groupKey) => {
    const students = studentsByStrandAndGrade[groupKey];
    const sections = availableSections[groupKey] || [];

    if (sections.length === 0) {
      console.warn(`No available sections for ${groupKey}`);
      return;
    }

    // Distribute students evenly across available sections
    students.forEach((student, index) => {
      const sectionIndex = index % sections.length;
      const section = sections[sectionIndex];

      // Check if section has capacity
      if (section.current_students < section.capacity) {
        assignments.push({
          lrn: student.lrn,
          section_id: section.section_id,
          section_name: section.section_name,
          strand: section.strand,
          grade_level: section.grade_level,
        });

        // Update the section's current student count (simulated)
        section.current_students++;

        console.log(
          `Assigned ${student.lname}, ${student.fname} (LRN: ${student.lrn}) to ${section.section_name}`
        );
      } else {
        console.warn(
          `Section ${section.section_name} is at capacity, cannot assign ${student.lname}, ${student.fname}`
        );
      }
    });
  });

  console.log(
    `Successfully assigned ${assignments.length} ALS students to sections`
  );
  return assignments;
}

/**
 * Test the function
 */
console.log("=== ALS Student Section Assignment Test ===\n");

try {
  const result = assignALSStudentSections();
  console.log("\nAssignment Results:");
  console.log(JSON.stringify(result, null, 2));

  // Verify all students were assigned
  const unassignedStudents = mockALSStudents.filter(
    (student) =>
      student.enrollment_status === "Enrolled" &&
      student.section === null &&
      !result.some((assignment) => assignment.lrn === student.lrn)
  );

  if (unassignedStudents.length > 0) {
    console.log(
      `\nWarning: ${unassignedStudents.length} students were not assigned sections`
    );
    unassignedStudents.forEach((student) => {
      console.log(
        `- ${student.lname}, ${student.fname} (LRN: ${student.lrn}) - ${student.strand}-${student.gradeLevel}`
      );
    });
  } else {
    console.log(
      "\n✅ All eligible ALS students were successfully assigned to sections"
    );
  }
} catch (error) {
  console.error("Error in section assignment:", error);
}
