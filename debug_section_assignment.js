// Debug script to test section assignment logic specifically
function debugSectionAssignment() {
  console.log("=== Testing Section Assignment Logic ===\n");

  // Test the specific scenario: Section A has 22 males, 1 female
  // Trying to add the 23rd male
  console.log("Scenario: Section A has 22 males, 1 female");
  console.log("Trying to add 23rd male...");

  const sectionA = { males: 22, females: 1 };
  const canAdd = canAddStudentToSection(
    sectionA.males,
    sectionA.females,
    "Male"
  );

  console.log(`Can add 23rd male to Section A? ${canAdd}`);

  if (canAdd) {
    sectionA.males++;
    console.log(
      `After adding: Section A has ${sectionA.males} males, ${sectionA.females} females`
    );
  } else {
    console.log("23rd male rejected from Section A");
  }

  // Test the condition that might be causing the issue
  console.log("\n=== Testing the specific condition ===");
  console.log("Condition: males + 1 === 23 && females > 22");
  console.log(
    `Values: (${sectionA.males} + 1) === 23 && ${sectionA.females} > 22`
  );
  console.log(
    `Result: ${sectionA.males + 1 === 23} && ${sectionA.females > 22} = ${sectionA.males + 1 === 23 && sectionA.females > 22}`
  );

  // Test what happens if we have 22 males and 23 females (should block 23rd male)
  console.log("\n=== Testing edge case ===");
  console.log("Scenario: Section A has 22 males, 23 females");
  console.log("Trying to add 23rd male...");

  const edgeCase = { males: 22, females: 23 };
  const canAddEdge = canAddStudentToSection(
    edgeCase.males,
    edgeCase.females,
    "Male"
  );

  console.log(`Can add 23rd male to Section A? ${canAddEdge}`);
  console.log("Condition: males + 1 === 23 && females > 22");
  console.log(
    `Values: (${edgeCase.males} + 1) === 23 && ${edgeCase.females} > 22`
  );
  console.log(
    `Result: ${edgeCase.males + 1 === 23} && ${edgeCase.females > 22} = ${edgeCase.males + 1 === 23 && edgeCase.females > 22}`
  );

  // Test the exact user scenario step by step
  console.log("\n=== Step-by-step simulation of user scenario ===");
  simulateUserScenario();
}

function simulateUserScenario() {
  // Start with empty section
  const sectionA = { males: 0, females: 0 };
  let malesAddedToA = 0;
  let malesAddedToB = 0;

  console.log("Processing 28 males and 1 female...");

  // Add males one by one
  for (let i = 1; i <= 28; i++) {
    if (i === 15) {
      // Add the female at position 15
      const canAddFemale = canAddStudentToSection(
        sectionA.males,
        sectionA.females,
        "Female"
      );
      if (canAddFemale) {
        sectionA.females++;
        console.log(
          `Female added to Section A at position ${i} (Males: ${sectionA.males}, Females: ${sectionA.females})`
        );
      } else {
        console.log(`Female rejected from Section A at position ${i}`);
      }
    }

    // Try to add male
    const canAddMale = canAddStudentToSection(
      sectionA.males,
      sectionA.females,
      "Male"
    );
    if (canAddMale) {
      sectionA.males++;
      malesAddedToA++;
      console.log(
        `Male ${i}: Added to Section A (Males: ${sectionA.males}, Females: ${sectionA.females})`
      );
    } else {
      malesAddedToB++;
      console.log(`Male ${i}: Rejected from Section A, would go to Section B`);
    }
  }

  console.log(
    `\nFinal result: Section A = ${sectionA.males} males + ${sectionA.females} females, Section B = ${malesAddedToB} males`
  );
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
debugSectionAssignment();
