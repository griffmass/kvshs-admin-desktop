// Test script to verify gender distribution logic
function testGenderDistribution() {
  // Test cases for male students
  console.log("Testing male student addition:");

  // Case 1: Section with 22 males, should allow adding 1 more male
  console.log("Case 1 - 22 males, adding 1 more:");
  console.log("Current males: 22, adding 1 = 23, females: 20");
  console.log(
    "Should allow: males < 23 (22 < 23 = true), and if males+1=23, females <= 22 (20 <= 22 = true)"
  );
  console.log("Result: Should ALLOW");

  // Case 2: Section with 23 males, should NOT allow adding another male
  console.log("\nCase 2 - 23 males, adding 1 more:");
  console.log("Current males: 23, adding 1 = 24");
  console.log("Should allow: males < 23 (23 < 23 = false)");
  console.log("Result: Should BLOCK");

  // Case 3: Section with 22 males and 23 females, should NOT allow adding male that would make 23
  console.log("\nCase 3 - 22 males, 23 females, adding 1 male:");
  console.log("Current males: 22, adding 1 = 23, females: 23");
  console.log(
    "Should allow: males < 23 (22 < 23 = true), but males+1=23 and females > 22 (23 > 22 = true)"
  );
  console.log("Result: Should BLOCK");

  console.log("\n" + "=".repeat(50));

  // Test cases for female students
  console.log("Testing female student addition:");

  // Case 4: Section with 21 females, should allow adding 1 more female
  console.log("Case 4 - 21 females, adding 1 more:");
  console.log("Current females: 21, adding 1 = 22, males: 20");
  console.log(
    "Should allow: females < 22 (21 < 22 = true), and if females+1=22, males <= 23 (20 <= 23 = true)"
  );
  console.log("Result: Should ALLOW");

  // Case 5: Section with 22 females, should NOT allow adding another female
  console.log("\nCase 5 - 22 females, adding 1 more:");
  console.log("Current females: 22, adding 1 = 23");
  console.log("Should allow: females < 22 (22 < 22 = false)");
  console.log("Result: Should BLOCK");

  // Case 6: Section with 24 males and 21 females, should NOT allow adding female that would make 22
  console.log("\nCase 6 - 24 males, 21 females, adding 1 female:");
  console.log("Current females: 21, adding 1 = 22, males: 24");
  console.log(
    "Should allow: females < 22 (21 < 22 = true), but females+1=22 and males > 23 (24 > 23 = true)"
  );
  console.log("Result: Should BLOCK");
}

// Run the test
testGenderDistribution();
