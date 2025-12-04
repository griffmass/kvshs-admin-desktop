// Debug script to understand the gender distribution issue
function debugGenderIssue() {
  console.log("=== Debugging Gender Distribution Issue ===\n");

  // Scenario: Enrolling 28 males and 1 female
  console.log("Scenario: Enrolling 28 males and 1 female to empty sections");
  console.log(
    "Expected result: Section A = 23 males + 1 female, Section B = 5 males"
  );
  console.log(
    "Actual result: Section A = 22 males + 1 female, Section B = 6 males"
  );
  console.log("");

  // Let's simulate what happens step by step
  console.log("Step-by-step simulation:");

  let sectionA_males = 0;
  let sectionA_females = 0;

  // Simulate adding students one by one
  for (let i = 1; i <= 28; i++) {
    // Try to add to section A
    const canAddToA = checkCanAddToSection(
      sectionA_males,
      sectionA_females,
      "Male"
    );

    if (canAddToA) {
      sectionA_males++;
      console.log(
        `Student ${i} (Male): Added to Section A (Males: ${sectionA_males}, Females: ${sectionA_females})`
      );
    } else {
      console.log(
        `Student ${i} (Male): Cannot add to Section A, would go to Section B`
      );
      // In reality, this student would be added to Section B
    }

    // After adding some males, add the female
    if (i === 1) {
      const canAddFemale = checkCanAddToSection(
        sectionA_males,
        sectionA_females,
        "Female"
      );
      if (canAddFemale) {
        sectionA_females++;
        console.log(
          `Student (Female): Added to Section A (Males: ${sectionA_males}, Females: ${sectionA_females})`
        );
      }
    }
  }

  console.log(
    `\nFinal Section A: ${sectionA_males} males, ${sectionA_females} females`
  );
  console.log(`Section B would have: ${28 - sectionA_males} males`);

  // Test the specific condition that's causing the issue
  console.log("\n=== Testing the problematic condition ===");
  console.log("When Section A has 22 males and 1 female:");
  console.log("- Trying to add 23rd male...");
  console.log("- Condition: males + 1 === 23 && females > 22");
  console.log(
    `- Actual: (22 + 1) === 23 && 1 > 22 = ${22 + 1 === 23} && ${1 > 22} = ${22 + 1 === 23 && 1 > 22}`
  );
  console.log("- Result: Should ALLOW because 1 is NOT > 22");
}

function checkCanAddToSection(males, females, studentSex) {
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
debugGenderIssue();
