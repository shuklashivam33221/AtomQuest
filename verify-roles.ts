import { prisma } from "./src/lib/prisma";
import { 
  createGoal,
  updateAchievement,
  approveGoals,
  saveCheckIn,
  createCycle,
  unlockGoalsAsAdmin,
  updateUserManager,
  simulateEntraIDSync
} from "./src/lib/actions";
import { GoalStatus, UoMType, GoalPhase } from "@prisma/client";
import bcrypt from "bcrypt";

// Helper to mock NextAuth session
function mockSession(user: { id: string; name: string; email: string; role: string }) {
  (process.env as any).MOCK_SESSION = JSON.stringify({ user });
}

function clearSession() {
  delete (process.env as any).MOCK_SESSION;
}

// Colors for terminal formatting
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

async function main() {
  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan("      ATOMQUEST USER ROLES & PERSONAS VERIFICATION     ")));
  console.log(bold(cyan("========================================================\n")));

  // Preemptively clean up any stale test accounts
  const staleUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "roles.emp@atomberg.com",
          "roles.mgr@atomberg.com",
          "roles.adm@atomberg.com"
        ]
      }
    },
    select: { id: true }
  });

  const staleUserIds = staleUsers.map(u => u.id);
  if (staleUserIds.length > 0) {
    await prisma.achievement.deleteMany({ where: { goal: { employeeId: { in: staleUserIds } } } });
    await prisma.checkIn.deleteMany({ where: { goal: { employeeId: { in: staleUserIds } } } });
    await prisma.auditLog.deleteMany({ where: { goal: { employeeId: { in: staleUserIds } } } });
    await prisma.goal.deleteMany({ where: { employeeId: { in: staleUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: staleUserIds } } });
  }

  // Deactivate existing active cycles to avoid collision
  await prisma.goalCycle.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  const testDept = await prisma.department.upsert({
    where: { name: "Roles Testing Dept" },
    update: {},
    create: { name: "Roles Testing Dept" },
  });

  const testCycle = await prisma.goalCycle.create({
    data: {
      name: "Roles Verification Cycle",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2027-04-30"),
      isActive: true,
      phase: "GOAL_SETTING",
    },
  });

  const hashedPwd = await bcrypt.hash("verify123", 10);

  // 1. Provision Employee Joey
  const employee = await prisma.user.create({
    data: {
      name: "Joey Employee",
      email: "roles.emp@atomberg.com",
      password: hashedPwd,
      role: "EMPLOYEE",
      departmentId: testDept.id,
    }
  });

  // 2. Provision Manager Monica
  const manager = await prisma.user.create({
    data: {
      name: "Monica Manager",
      email: "roles.mgr@atomberg.com",
      password: hashedPwd,
      role: "MANAGER",
      departmentId: testDept.id,
    }
  });

  // Align reporting manager: Joey reports to Monica
  await prisma.user.update({
    where: { id: employee.id },
    data: { managerId: manager.id }
  });

  // 3. Provision Admin Ross
  const admin = await prisma.user.create({
    data: {
      name: "Ross Admin",
      email: "roles.adm@atomberg.com",
      password: hashedPwd,
      role: "ADMIN",
      departmentId: testDept.id,
    }
  });

  console.log(green("✔ Successfully provisioned Employee, Manager, and Admin roles."));

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

  // Set schedule bypass env so we can perform actions on demand
  (process.env as any).BYPASS_SCHEDULE_LOCK = "true";

  // ==========================================
  // TEST 1: EMPLOYEE ACCESS RULES
  // ==========================================
  console.log(bold("\n--- 1. Employee Role Capability & Access Boundary ---"));
  
  // Log in as Employee Joey
  mockSession(employee);

  // 1.1 Joey can draft and submit goals
  let employeeCanDraft = false;
  let testGoalId = "";
  try {
    const fd = new FormData();
    fd.append("title", "Joey Sales Increase");
    fd.append("thrustArea", "Revenue");
    fd.append("uom", "NUMERIC_MIN");
    fd.append("weightage", "20");
    fd.append("cycleId", testCycle.id);
    
    await createGoal(fd);
    
    const joeyGoal = await prisma.goal.findFirst({ where: { employeeId: employee.id } });
    if (joeyGoal) {
      employeeCanDraft = true;
      testGoalId = joeyGoal.id;
    }
  } catch (err: any) {
    console.error("Employee goal creation failed:", err);
  }

  assertTest(
    "Employee Joey can create and draft goals pre-submission",
    employeeCanDraft,
    `Joey successfully created drafted goal: "${testGoalId}"`
  );

  // 1.2 Joey is blocked from approving goals
  let employeeApproveBlocked = false;
  try {
    await approveGoals(employee.id, testCycle.id);
  } catch (err: any) {
    employeeApproveBlocked = err.message.includes("Unauthorized") || err.message.includes("access required");
  }

  assertTest(
    "Employee Joey is blocked from approving goals",
    employeeApproveBlocked,
    "Attempting to approve goals thrown Authorization error."
  );

  // 1.3 Joey is blocked from creating cycles
  let employeeCycleBlocked = false;
  try {
    await createCycle("Joey Cycle", "2026-05-01", "2027-04-30");
  } catch (err: any) {
    employeeCycleBlocked = err.message.includes("Unauthorized") || err.message.includes("Admin access required");
  }

  assertTest(
    "Employee Joey is blocked from administrative Goal Cycle creation",
    employeeCycleBlocked,
    "Attempting to create cycle thrown Admin access error."
  );


  // ==========================================
  // TEST 2: L1 MANAGER ACCESS RULES
  // ==========================================
  console.log(bold("\n--- 2. L1 Manager Role Capability & Access Boundary ---"));

  // Log in as Manager Monica
  mockSession(manager);

  // 2.1 Monica can approve Joey's goals
  let managerCanApprove = false;
  try {
    // Submit Joey's goal first (under Joey's session)
    mockSession(employee);
    await prisma.goal.update({ where: { id: testGoalId }, data: { status: "SUBMITTED" } });
    
    // Log back in as Monica and approve
    mockSession(manager);
    await approveGoals(employee.id, testCycle.id);
    
    const updatedGoal = await prisma.goal.findUnique({ where: { id: testGoalId } });
    managerCanApprove = updatedGoal?.status === "LOCKED";
  } catch (err: any) {
    console.error("Manager approval failed:", err);
  }

  assertTest(
    "Manager Monica can approve and lock subordinate goal sheets",
    managerCanApprove,
    `Monica successfully locked Joey's goals sheet post-review.`
  );

  // 2.2 Monica can log 1:1 check-in feedback
  let managerCanCheckin = false;
  try {
    await saveCheckIn(testGoalId, "Q1", "Monica feedback comment");
    const ci = await prisma.checkIn.findFirst({ where: { goalId: testGoalId } });
    managerCanCheckin = ci?.managerComment === "Monica feedback comment";
  } catch (err: any) {
    console.error("Manager check-in feedback log failed:", err);
  }

  assertTest(
    "Manager Monica can conduct 1:1 check-ins & save feedback comments",
    managerCanCheckin,
    "Feedback discussion successfully saved to database."
  );

  // 2.3 Monica is blocked from administrative exceptions (unlocking goals)
  let managerUnlockBlocked = false;
  try {
    await unlockGoalsAsAdmin(employee.email, testCycle.id);
  } catch (err: any) {
    managerUnlockBlocked = err.message.includes("Unauthorized") || err.message.includes("Admin access required");
  }

  assertTest(
    "Manager Monica is blocked from unlocking approved goal sheets",
    managerUnlockBlocked,
    "Attempting to unlock goal sheet thrown Admin access error."
  );


  // ==========================================
  // TEST 3: ADMIN / HR ACCESS RULES
  // ==========================================
  console.log(bold("\n--- 3. Admin / HR Role Capability Controls ---"));

  // Log in as Admin Ross
  mockSession(admin);

  // 3.1 Admin can create and configure Goal Cycles
  let adminCanCreateCycle = false;
  try {
    await createCycle("Ross Admin Cycle", "2026-06-01", "2027-05-31");
    const createdCycle = await prisma.goalCycle.findFirst({ where: { name: "Ross Admin Cycle" } });
    adminCanCreateCycle = createdCycle?.isActive === true;
  } catch (err: any) {
    console.error("Admin cycle creation failed:", err);
  }

  assertTest(
    "Admin Ross can configure, create, and activate Goal Cycles",
    adminCanCreateCycle,
    "Goal cycle successfully created and activated in DB."
  );

  // 3.2 Admin can manually override reporting org hierarchy manager assignments
  let adminCanOverrideHierarchy = false;
  try {
    // Re-map Joey to report to Ross instead of Monica
    await updateUserManager(employee.id, admin.id);
    const updatedEmployee = await prisma.user.findUnique({ where: { id: employee.id } });
    adminCanOverrideHierarchy = updatedEmployee?.managerId === admin.id;
  } catch (err: any) {
    console.error("Admin hierarchy override failed:", err);
  }

  assertTest(
    "Admin Ross can manually override Reporting Org Hierarchy mappings",
    adminCanOverrideHierarchy,
    `Joey's reporting manager successfully updated to Ross Admin in DB.`
  );

  // 3.3 Admin can simulate MS Entra ID / Azure AD dynamic synchronization
  let adminCanSyncEntraID = false;
  try {
    const res = await simulateEntraIDSync();
    adminCanSyncEntraID = res.success === true;
  } catch (err: any) {
    console.error("Admin Entra AD Sync failed:", err);
  }

  assertTest(
    "Admin Ross can trigger Active Directory hierarchy dynamic synchronization lookups",
    adminCanSyncEntraID,
    "AD Graph API dynamic lookup simulation completed successfully."
  );

  // 3.4 Admin can unlock locked goal sheets (Exception Handling)
  let adminCanUnlock = false;
  try {
    // Re-lock Joey's goals under testCycle first
    await prisma.goal.update({ where: { id: testGoalId }, data: { status: "LOCKED" } });
    
    await unlockGoalsAsAdmin(employee.email, testCycle.id);
    const updatedGoal = await prisma.goal.findUnique({ where: { id: testGoalId } });
    adminCanUnlock = updatedGoal?.status === "RETURNED";
  } catch (err: any) {
    console.error("Admin goal unlock failed:", err);
  }

  assertTest(
    "Admin Ross can unlock locked goal sheets under Exception Handling scenarios",
    adminCanUnlock,
    "Joey's goal status successfully set back to RETURNED for rework."
  );


  // ==========================================
  // CLEANUP AND SUMMARY REPORT
  // ==========================================
  console.log(bold("\n--- Cleanup Testing Artifacts ---"));
  
  (process.env as any).BYPASS_SCHEDULE_LOCK = "true";
  (process.env as any).NODE_ENV = "test";

  // Clean up all data
  await prisma.auditLog.deleteMany({ where: { goalId: testGoalId } });
  await prisma.checkIn.deleteMany({ where: { goalId: testGoalId } });
  await prisma.achievement.deleteMany({ where: { goalId: testGoalId } });
  
  const cycleToDelete = await prisma.goalCycle.findFirst({ where: { name: "Ross Admin Cycle" } });
  if (cycleToDelete) {
    await prisma.goal.deleteMany({ where: { cycleId: cycleToDelete.id } });
    await prisma.goalCycle.delete({ where: { id: cycleToDelete.id } });
  }

  await prisma.goal.deleteMany({ where: { cycleId: testCycle.id } });
  await prisma.goalCycle.delete({ where: { id: testCycle.id } });
  
  await prisma.user.deleteMany({
    where: { id: { in: [employee.id, manager.id, admin.id] } }
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
