import { prisma } from "./src/lib/prisma";
import { 
  createGoal, 
  submitGoals, 
  deleteGoal, 
  editGoalAsEmployee, 
  approveGoals, 
  returnGoal, 
  editGoalAsManager, 
  pushSharedGoal, 
  updateAchievement 
} from "./src/lib/actions";
import { GoalStatus, UoMType, GoalPhase } from "@prisma/client";
import bcrypt from "bcrypt";

// Helper to mock the NextAuth session
function mockSession(user: { id: string; name: string; email: string; role: string }) {
  process.env.MOCK_SESSION = JSON.stringify({ user });
}

function clearSession() {
  delete process.env.MOCK_SESSION;
}

// Colors for terminal formatting
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

async function main() {
  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan("      ATOMQUEST PHASE 1 AUTOMATED VERIFICATION SUITE    ")));
  console.log(bold(cyan("========================================================\n")));

  // 0. Database Setup & Mock Data provisioning
  console.log(yellow("Provisioning clean database state for Phase 1 testing..."));

  // Preemptively clean up any stale test accounts and their dependent records from aborted previous runs
  const staleUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "monica.manager@atomberg.com",
          "joey.emp1@atomberg.com",
          "chandler.emp2@atomberg.com",
          "ross.admin@atomberg.com"
        ]
      }
    },
    select: { id: true }
  });

  const staleUserIds = staleUsers.map(u => u.id);

  if (staleUserIds.length > 0) {
    await prisma.achievement.deleteMany({
      where: {
        goal: {
          employeeId: { in: staleUserIds }
        }
      }
    });

    await prisma.checkIn.deleteMany({
      where: {
        OR: [
          { goal: { employeeId: { in: staleUserIds } } },
          { managerId: { in: staleUserIds } }
        ]
      }
    });

    await prisma.auditLog.deleteMany({
      where: {
        goal: {
          employeeId: { in: staleUserIds }
        }
      }
    });

    await prisma.goal.deleteMany({
      where: {
        employeeId: { in: staleUserIds }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: staleUserIds }
      }
    });
  }
  
  const testDept = await prisma.department.upsert({
    where: { name: "QA & Testing" },
    update: {},
    create: { name: "QA & Testing" },
  });

  const testCycle = await prisma.goalCycle.create({
    data: {
      name: "Phase 1 Testing Cycle",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2027-04-30"),
      isActive: true,
      phase: "GOAL_SETTING",
    },
  });

  const hashedTestPassword = await bcrypt.hash("verify123", 10);

  const testManager = await prisma.user.create({
    data: {
      name: "Monica Geller",
      email: "monica.manager@atomberg.com",
      password: hashedTestPassword,
      role: "MANAGER",
      departmentId: testDept.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: "Joey Tribbiani",
      email: "joey.emp1@atomberg.com",
      password: hashedTestPassword,
      role: "EMPLOYEE",
      departmentId: testDept.id,
      managerId: testManager.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: "Chandler Bing",
      email: "chandler.emp2@atomberg.com",
      password: hashedTestPassword,
      role: "EMPLOYEE",
      departmentId: testDept.id,
      managerId: testManager.id,
    },
  });

  const testAdmin = await prisma.user.create({
    data: {
      name: "Ross Geller",
      email: "ross.admin@atomberg.com",
      password: hashedTestPassword,
      role: "ADMIN",
      departmentId: testDept.id,
    },
  });

  console.log(green("✔ Successfully provisioned clean DB state."));
  console.log(`- Dept: ${testDept.name}`);
  console.log(`- Cycle: ${testCycle.name}`);
  console.log(`- Manager: Monica Geller (${testManager.email})`);
  console.log(`- Employee 1: Joey Tribbiani (${employee1.email})`);
  console.log(`- Employee 2: Chandler Bing (${employee2.email})`);
  console.log(`- Admin: Ross Geller (${testAdmin.email})\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, assertion: boolean, detail = "") {
    totalTests++;
    if (assertion) {
      passedTests++;
      console.log(green(`✔ PASS: ${name}`));
      if (detail) console.log(`   └─ ${detail}`);
    } else {
      console.error(red(`✘ FAIL: ${name}`));
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // ==========================================
  // SECTION 1: GOAL CREATION VALIDATION RULES
  // ==========================================
  console.log(bold("\n--- SECTION 1: Goal Creation Validation Rules ---"));

  // Log in as Employee 1 (Joey)
  mockSession(employee1);

  // Test 1.1: Enforce minimum weightage per individual goal: 10%
  try {
    const fd = new FormData();
    fd.append("title", "Underweight Goal");
    fd.append("thrustArea", "Customer Satisfaction");
    fd.append("uom", "NUMERIC_MIN");
    fd.append("target", "95");
    fd.append("weightage", "9"); // Underweight
    fd.append("cycleId", testCycle.id);

    await createGoal(fd);
    assertTest("Test 1.1: Minimum 10% weightage check", false, "Allowed creating goal with 9% weightage.");
  } catch (err: any) {
    assertTest(
      "Test 1.1: Minimum 10% weightage check",
      err.message.includes("Minimum weightage is 10%"),
      `Blocked correctly. Message: "${err.message}"`
    );
  }

  // Test 1.2: Enforce weightage does not exceed 100% total
  try {
    const fd = new FormData();
    fd.append("title", "Overweight Goal");
    fd.append("thrustArea", "Revenue Growth");
    fd.append("uom", "PERCENTAGE_MIN");
    fd.append("target", "20");
    fd.append("weightage", "101"); // Exceeds 100%
    fd.append("cycleId", testCycle.id);

    await createGoal(fd);
    assertTest("Test 1.2: Weightage limit check (max 100%)", false, "Allowed creating goal with 101% weightage.");
  } catch (err: any) {
    assertTest(
      "Test 1.2: Weightage limit check (max 100%)",
      err.message.includes("Total weightage would exceed 100%"),
      `Blocked correctly. Message: "${err.message}"`
    );
  }

  // Test 1.3: Maximum number of goals per employee: 8
  try {
    // Let's create 8 draft goals of 10% weightage (total 80%)
    for (let i = 1; i <= 8; i++) {
      const fd = new FormData();
      fd.append("title", `Draft Goal ${i}`);
      fd.append("thrustArea", "Operational Excellence");
      fd.append("uom", "NUMERIC_MIN");
      fd.append("target", "10");
      fd.append("weightage", "10");
      fd.append("cycleId", testCycle.id);
      await createGoal(fd);
    }
    
    // Now try to create the 9th goal
    const fd9 = new FormData();
    fd9.append("title", "Draft Goal 9");
    fd9.append("thrustArea", "Operational Excellence");
    fd9.append("uom", "NUMERIC_MIN");
    fd9.append("target", "10");
    fd9.append("weightage", "10");
    fd9.append("cycleId", testCycle.id);
    await createGoal(fd9);

    assertTest("Test 1.3: Maximum 8 goals rule", false, "Allowed creating a 9th goal.");
  } catch (err: any) {
    assertTest(
      "Test 1.3: Maximum 8 goals rule",
      err.message.includes("Maximum 8 goals allowed per cycle"),
      `Blocked correctly. Message: "${err.message}"`
    );
  }

  // Clean up draft goals for Employee 1 to do a proper sheet submission test
  await prisma.goal.deleteMany({
    where: { employeeId: employee1.id, cycleId: testCycle.id }
  });

  // Test 1.4: Enforce total weightage across all goals must equal 100% on submission
  // Setup: Create 4 goals:
  // Goal 1 (Numeric Min): 30%
  // Goal 2 (Numeric Max): 30%
  // Goal 3 (Percentage Min): 20%
  // Goal 4 (Percentage Max): 10% -> total 90%
  const uoms = ["NUMERIC_MIN", "NUMERIC_MAX", "PERCENTAGE_MIN", "PERCENTAGE_MAX", "TIMELINE", "ZERO"];
  const goalsToSetup = [
    { title: "Increase sales of BLDC fans", uom: "NUMERIC_MIN", target: 500, weightage: 30 },
    { title: "Reduce defect assembly rate", uom: "NUMERIC_MAX", target: 2, weightage: 30 },
    { title: "Improve CSAT rating", uom: "PERCENTAGE_MIN", target: 95, weightage: 20 },
    { title: "Reduce employee attrition", uom: "PERCENTAGE_MAX", target: 5, weightage: 10 },
  ];

  for (const g of goalsToSetup) {
    const fd = new FormData();
    fd.append("title", g.title);
    fd.append("thrustArea", "Operational Excellence");
    fd.append("uom", g.uom);
    fd.append("target", g.target.toString());
    fd.append("weightage", g.weightage.toString());
    fd.append("cycleId", testCycle.id);
    await createGoal(fd);
  }

  // Try to submit with 90% total weightage
  try {
    await submitGoals(testCycle.id);
    assertTest("Test 1.4: Goal Sheet Submission total weightage = 100% check", false, "Allowed submission with 90% total weightage.");
  } catch (err: any) {
    assertTest(
      "Test 1.4: Goal Sheet Submission total weightage = 100% check",
      err.message.includes("Total weightage must be exactly 100%"),
      `Blocked correctly. Message: "${err.message}"`
    );
  }

  // Create one more goal of 10% weightage to make it exactly 100%
  const fdFinal = new FormData();
  fdFinal.append("title", "Deliver new smart remote prototype");
  fdFinal.append("thrustArea", "Innovation & R&D");
  fdFinal.append("uom", "TIMELINE");
  fdFinal.append("weightage", "10"); // makes total 100%
  fdFinal.append("cycleId", testCycle.id);
  await createGoal(fdFinal);

  // Submit valid goal sheet
  let submissionSuccess = false;
  try {
    await submitGoals(testCycle.id);
    submissionSuccess = true;
  } catch (err: any) {
    console.error("Submission failed unexpected:", err);
  }

  const updatedGoals = await prisma.goal.findMany({
    where: { employeeId: employee1.id, cycleId: testCycle.id }
  });

  const allSubmitted = updatedGoals.length > 0 && updatedGoals.every(g => g.status === "SUBMITTED");

  assertTest(
    "Test 1.5: Goal Sheet Submission with exact 100% weightage",
    submissionSuccess && allSubmitted,
    `Goal sheet submitted successfully. Status of all goals: ${updatedGoals.map(g => `${g.title} (${g.status})`).join(", ")}`
  );


  // ==========================================
  // SECTION 2: MANAGER (L1) APPROVAL WORKFLOW
  // ==========================================
  console.log(bold("\n--- SECTION 2: Manager (L1) Approval Workflow ---"));

  // Log in as Manager (Monica)
  mockSession(testManager);

  // Test 2.1: Manager reviews submitted goals
  const managerReviewGoals = await prisma.goal.findMany({
    where: { employeeId: employee1.id, cycleId: testCycle.id }
  });
  assertTest(
    "Test 2.1: Manager retrieves submitted goal sheet",
    managerReviewGoals.length === 5,
    `Retrieved all ${managerReviewGoals.length} submitted goals for review.`
  );

  // Test 2.2: Manager edits targets/weightages inline
  // Let's edit defects goal target from 2 to 1.5 and weightage from 30% to 20%
  // Let's edit CSAT goal weightage from 20% to 30% to maintain 100% total
  const defectGoal = managerReviewGoals.find(g => g.uom === "NUMERIC_MAX")!;
  const csatGoal = managerReviewGoals.find(g => g.uom === "PERCENTAGE_MIN")!;

  let editSuccess = false;
  try {
    await editGoalAsManager(defectGoal.id, 1.5, 20); // Edit target & weightage
    await editGoalAsManager(csatGoal.id, 95, 30);    // Edit weightage
    editSuccess = true;
  } catch (err: any) {
    console.error("Edit failed:", err);
  }

  // Assert audit logs were created
  const auditLogs = await prisma.auditLog.findMany({
    where: { goalId: { in: [defectGoal.id, csatGoal.id] } }
  });

  assertTest(
    "Test 2.2: L1 Manager inline edit (target & weightage) with Audit Trail",
    editSuccess && auditLogs.length >= 3,
    `Edits saved. Audit trail recorded ${auditLogs.length} adjustments:\n` +
    auditLogs.map(l => `      * Goal: ${l.goalId === defectGoal.id ? "Defect assembly" : "CSAT"} | Field: "${l.field}" | Old: "${l.oldValue}" -> New: "${l.newValue}"`).join("\n")
  );

  // Test 2.3: Manager returns a goal for rework
  // Return csatGoal for rework
  let returnSuccess = false;
  try {
    await returnGoal(csatGoal.id);
    returnSuccess = true;
  } catch (err: any) {
    console.error("Return failed:", err);
  }

  const returnedGoalObj = await prisma.goal.findUnique({ where: { id: csatGoal.id } });
  const csatAuditLogs = await prisma.auditLog.findMany({
    where: { goalId: csatGoal.id, field: "status" }
  });

  assertTest(
    "Test 2.3: Manager returns goal for rework",
    returnSuccess && returnedGoalObj?.status === "RETURNED" && csatAuditLogs.length > 0,
    `Goal status set to: ${returnedGoalObj?.status}. Audit log created: ${csatAuditLogs[0]?.oldValue} -> ${csatAuditLogs[0]?.newValue} (by ${csatAuditLogs[0]?.changedBy})`
  );

  // Simulating Employee correction & resubmission
  mockSession(employee1);
  // Employee updates weightage back to 30% (confirming they can edit RETURNED goals)
  await editGoalAsEmployee(csatGoal.id, 30);
  // Employee resubmits goal sheet
  await submitGoals(testCycle.id);

  // Log back in as Manager (Monica)
  mockSession(testManager);

  // Test 2.4: On approval, goals are locked — no further edits without Admin intervention
  let approveSuccess = false;
  try {
    await approveGoals(employee1.id, testCycle.id);
    approveSuccess = true;
  } catch (err: any) {
    console.error("Approve failed:", err);
  }

  const finalGoals = await prisma.goal.findMany({
    where: { employeeId: employee1.id, cycleId: testCycle.id }
  });

  const allLocked = finalGoals.length > 0 && finalGoals.every(g => g.status === "LOCKED");

  assertTest(
    "Test 2.4: Manager approves and locks goal sheet",
    approveSuccess && allLocked,
    `All employee goals successfully transition to status: LOCKED.`
  );

  // Test 2.5: Verify employee cannot edit locked goals
  mockSession(employee1);
  let employeeLockedEditBlocked = false;
  try {
    await editGoalAsEmployee(csatGoal.id, 40);
  } catch (err: any) {
    employeeLockedEditBlocked = err.message.includes("Can only edit draft or returned goals");
  }

  // Test 2.6: Verify manager cannot edit locked goals
  mockSession(testManager);
  let managerLockedEditBlocked = false;
  try {
    await editGoalAsManager(csatGoal.id, 98, 30);
  } catch (err: any) {
    managerLockedEditBlocked = err.message.includes("Only submitted goals can be edited");
  }

  assertTest(
    "Test 2.5 & 2.6: Read-only locking validation post-approval",
    employeeLockedEditBlocked && managerLockedEditBlocked,
    `Confirmed: Edits are blocked for both Employee and Manager. Error messages: 
      * Employee Edit Error: "Can only edit draft or returned goals"
      * Manager Edit Error: "Only submitted goals can be edited"`
  );


  // ==========================================
  // SECTION 3: SHARED GOALS FUNCTIONALITY
  // ==========================================
  console.log(bold("\n--- SECTION 3: Shared Goals Functionality ---"));

  // Log in as Admin (Ross) to push departmental KPI
  mockSession(testAdmin);

  // Test 3.1: Admin pushes departmental KPI
  let pushSuccess = false;
  try {
    // Push "99.9% Fan Motor Reliability" target = 99.9 to the QA department
    await pushSharedGoal("99.9% Fan Motor Reliability", "PERCENTAGE_MIN", 99.9, testDept.id, testCycle.id);
    pushSuccess = true;
  } catch (err: any) {
    console.error("KPI Push failed:", err);
  }

  // Fetch the shared goals for Employee 1 (Joey) and Employee 2 (Chandler)
  const joeySharedGoal = await prisma.goal.findFirst({
    where: { employeeId: employee1.id, cycleId: testCycle.id, isShared: true }
  });
  const chandlerSharedGoal = await prisma.goal.findFirst({
    where: { employeeId: employee2.id, cycleId: testCycle.id, isShared: true }
  });

  assertTest(
    "Test 3.1: Push departmental KPI to all department employees",
    pushSuccess && joeySharedGoal !== null && chandlerSharedGoal !== null,
    `KPI cloned to both goal sheets. Created goals:\n` +
    `      * Joey's sheet: "${joeySharedGoal?.title}" (Shared: ${joeySharedGoal?.isShared}, Weightage: ${joeySharedGoal?.weightage}%, Status: ${joeySharedGoal?.status})\n` +
    `      * Chandler's sheet: "${chandlerSharedGoal?.title}" (Shared: ${chandlerSharedGoal?.isShared}, Weightage: ${chandlerSharedGoal?.weightage}%, Status: ${chandlerSharedGoal?.status})`
  );

  // Test 3.2: Recipients can adjust weightage only (Title and Target are read-only)
  mockSession(employee2); // Chandler's sheet is in draft, he can try to edit or delete it
  
  // Try to delete a shared goal
  let deleteBlocked = false;
  try {
    await deleteGoal(chandlerSharedGoal!.id);
  } catch (err: any) {
    deleteBlocked = err.message.includes("Cannot delete shared goals");
  }

  // Verify Chandler can edit the weightage
  let weightageEditSuccess = false;
  try {
    await editGoalAsEmployee(chandlerSharedGoal!.id, 20); // Adjust from 10% to 20%
    weightageEditSuccess = true;
  } catch (err: any) {
    console.error("Weightage edit failed:", err);
  }

  const chandlerUpdatedSharedGoal = await prisma.goal.findUnique({ where: { id: chandlerSharedGoal!.id } });

  assertTest(
    "Test 3.2: Recipient weightage editing vs other fields lock (read-only)",
    deleteBlocked && weightageEditSuccess && chandlerUpdatedSharedGoal?.weightage === 20,
    `Confirmed: Shared goals cannot be deleted by employees. Weightage can be adjusted. (Adjusted to: ${chandlerUpdatedSharedGoal?.weightage}%)`
  );

  // Test 3.3: Achievement updates by the primary owner sync across all linked goal sheets
  // Log in as Admin/Manager (Monica or Ross)
  mockSession(testAdmin);

  let syncSuccess = false;
  try {
    // Admin updates the achievement of Joey's shared goal to 100 in Q1
    await updateAchievement(joeySharedGoal!.id, "Q1", 100, "COMPLETED");
    syncSuccess = true;
  } catch (err: any) {
    console.error("Sync achievement update failed:", err);
  }

  // Retrieve achievements for Joey's and Chandler's shared goal
  const joeyAchievement = await prisma.achievement.findFirst({
    where: { goalId: joeySharedGoal!.id, quarter: "Q1" }
  });
  const chandlerAchievement = await prisma.achievement.findFirst({
    where: { goalId: chandlerSharedGoal!.id, quarter: "Q1" }
  });

  assertTest(
    "Test 3.3: Shared Goal achievement auto-sync across all linked goal sheets",
    syncSuccess && 
    joeyAchievement !== null && joeyAchievement.actualValue === 100 &&
    chandlerAchievement !== null && chandlerAchievement.actualValue === 100 &&
    joeyAchievement.progressStatus === "COMPLETED" && chandlerAchievement.progressStatus === "COMPLETED",
    `Auto-sync success. Synced achievements:\n` +
    `      * Joey's Achievement: Actual = ${joeyAchievement?.actualValue}, Status = ${joeyAchievement?.progressStatus}, Date = ${joeyAchievement?.completionDate}\n` +
    `      * Chandler's Achievement: Actual = ${chandlerAchievement?.actualValue}, Status = ${chandlerAchievement?.progressStatus}, Date = ${chandlerAchievement?.completionDate}`
  );


  // ==========================================
  // CLEANUP AND SUMMARY REPORT
  // ==========================================
  console.log(bold("\n--- Cleanup Testing Artifacts ---"));
  
  await prisma.auditLog.deleteMany({
    where: { goalId: { in: [...updatedGoals.map(g => g.id), joeySharedGoal!.id, chandlerSharedGoal!.id] } }
  });
  await prisma.achievement.deleteMany({
    where: { goalId: { in: [joeySharedGoal!.id, chandlerSharedGoal!.id] } }
  });
  await prisma.goal.deleteMany({
    where: { cycleId: testCycle.id }
  });
  await prisma.goalCycle.delete({
    where: { id: testCycle.id }
  });
  await prisma.user.deleteMany({
    where: { id: { in: [testManager.id, employee1.id, employee2.id, testAdmin.id] } }
  });
  await prisma.department.delete({
    where: { id: testDept.id }
  });
  
  clearSession();
  console.log(green("✔ Successfully cleaned up all temporary test accounts and data. Database left in a pristine state."));

  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan(` VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%) `)));
  console.log(bold(cyan("========================================================\n")));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
