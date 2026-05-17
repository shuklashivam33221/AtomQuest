import { prisma } from "./src/lib/prisma";
import { 
  updateAchievement,
  saveCheckIn
} from "./src/lib/actions";
import { GoalStatus, UoMType, GoalPhase } from "@prisma/client";
import { computeProgressScore } from "./src/lib/scoring";
import bcrypt from "bcrypt";

// Helper to mock NextAuth session
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
  process.env.BYPASS_SCHEDULE_LOCK = "true";
  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan("      ATOMQUEST PHASE 2 AUTOMATED VERIFICATION SUITE    ")));
  console.log(bold(cyan("========================================================\n")));

  // 0. Database Setup & Mock Data provisioning
  console.log(yellow("Provisioning clean database state for Phase 2 testing..."));

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
      name: "Phase 2 Testing Cycle",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2027-04-30"),
      isActive: true,
      phase: "Q1",
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

  console.log(green("✔ Successfully provisioned clean DB state."));
  console.log(`- Dept: ${testDept.name}`);
  console.log(`- Cycle: ${testCycle.name}`);
  console.log(`- Manager: Monica Geller (${testManager.email})`);
  console.log(`- Employee: Joey Tribbiani (${employee1.email})\n`);

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

  // Provision LOCKED goals for Employee 1 (Joey) so he can record achievements
  console.log(yellow("Provisioning 4 LOCKED goals of varying UoM types for Joey..."));
  
  const g1 = await prisma.goal.create({
    data: {
      title: "Increase Q1 BLDC fan sales revenue",
      thrustArea: "Revenue Growth",
      uom: "NUMERIC_MIN",
      target: 1000,
      weightage: 30,
      status: "LOCKED",
      employeeId: employee1.id,
      cycleId: testCycle.id,
    }
  });

  const g2 = await prisma.goal.create({
    data: {
      title: "Reduce TAT for motor assembly defects",
      thrustArea: "Operational Excellence",
      uom: "NUMERIC_MAX",
      target: 2,
      weightage: 30,
      status: "LOCKED",
      employeeId: employee1.id,
      cycleId: testCycle.id,
    }
  });

  const g3 = await prisma.goal.create({
    data: {
      title: "Zero Safety Incidents on assembly floor",
      thrustArea: "Operational Excellence",
      uom: "ZERO",
      target: 0,
      weightage: 20,
      status: "LOCKED",
      employeeId: employee1.id,
      cycleId: testCycle.id,
    }
  });

  const g4 = await prisma.goal.create({
    data: {
      title: "Complete ISO Quality Certification",
      thrustArea: "Innovation & Quality",
      uom: "TIMELINE",
      target: 1,
      weightage: 20,
      status: "LOCKED",
      employeeId: employee1.id,
      cycleId: testCycle.id,
    }
  });

  console.log(green("✔ Goals provisioned. All set to locked state. Ready for Phase 2.\n"));

  // ==========================================
  // TEST 2.1: EMPLOYEE ACHIEVEMENT LOGGING
  // ==========================================
  console.log(bold("--- Test 2.1: Employee Quarterly Achievement Logging ---"));
  
  // Log in as Joey
  mockSession(employee1);

  let logSuccess = false;
  try {
    // Record Q1 achievements
    await updateAchievement(g1.id, "Q1", 800, "ON_TRACK");
    await updateAchievement(g2.id, "Q1", 4, "ON_TRACK");
    await updateAchievement(g3.id, "Q1", 0, "COMPLETED");
    await updateAchievement(g4.id, "Q1", 1, "COMPLETED");
    logSuccess = true;
  } catch (err: any) {
    console.error("Failed to log achievements:", err);
  }

  const joeyAchievements = await prisma.achievement.findMany({
    where: { goalId: { in: [g1.id, g2.id, g3.id, g4.id] }, quarter: "Q1" }
  });

  assertTest(
    "Test 2.1: Employee logs quarterly achievements",
    logSuccess && joeyAchievements.length === 4,
    `Joey successfully logged Q1 actual values and progress statuses to DB:\n` +
    joeyAchievements.map(a => `      * Goal ID: ${a.goalId} | Actual: ${a.actualValue} | Status: ${a.progressStatus}`).join("\n")
  );

  // ==========================================
  // TEST 2.2: SYSTEM-COMPUTED PROGRESS SCORES
  // ==========================================
  console.log(bold("\n--- Test 2.2: System-Computed Progress Score Formulas ---"));

  // Formula check 1: Min (Numeric / %) - Higher is Better
  // Target: 1000, Actual: 800 -> (800 / 1000) * 100 = 80%
  const score1 = computeProgressScore("NUMERIC_MIN", 1000, 800, "ON_TRACK");
  assertTest(
    "Formula 2.2.1: Min UoM (Higher is Better)",
    score1 === 80,
    `Calculated score: ${score1}% (Expected: 80%)`
  );

  // Formula check 2: Max (Numeric / %) - Lower is Better
  // Target: 2, Actual: 4 -> (2 / 4) * 100 = 50%
  const score2 = computeProgressScore("NUMERIC_MAX", 2, 4, "ON_TRACK");
  assertTest(
    "Formula 2.2.2: Max UoM (Lower is Better - Underachieved)",
    score2 === 50,
    `Calculated score: ${score2}% (Expected: 50%)`
  );

  // Formula check 3: Max UoM Overachievement cap at 100%
  // Target: 2, Actual: 1 -> (2 / 1) * 100 = 200%, capped at 100%
  const score2Over = computeProgressScore("NUMERIC_MAX", 2, 1, "COMPLETED");
  assertTest(
    "Formula 2.2.3: Max UoM Overachievement cap at 100%",
    score2Over === 100,
    `Calculated score: ${score2Over}% (Expected: 100%)`
  );

  // Formula check 4: Zero UoM (Zero = Success)
  // Target: 0, Actual: 0 -> 100%
  const score3Success = computeProgressScore("ZERO", 0, 0, "COMPLETED");
  // Target: 0, Actual: 1 -> 0%
  const score3Fail = computeProgressScore("ZERO", 0, 1, "ON_TRACK");
  assertTest(
    "Formula 2.2.4: Zero UoM (Zero = Success)",
    score3Success === 100 && score3Fail === 0,
    `Calculated scores: Actual 0 = ${score3Success}%, Actual 1 = ${score3Fail}% (Expected: 100% and 0%)`
  );

  // Formula check 5: Timeline UoM (Date-based completion)
  // Status = COMPLETED -> 100%
  const score4Success = computeProgressScore("TIMELINE", 1, 1, "COMPLETED");
  const score4Pending = computeProgressScore("TIMELINE", 1, null, "NOT_STARTED");
  assertTest(
    "Formula 2.2.5: Timeline UoM (Date-based completion)",
    score4Success === 100 && score4Pending === 0,
    `Calculated scores: Completed = ${score4Success}%, Not Started = ${score4Pending}% (Expected: 100% and 0%)`
  );


  // ==========================================
  // TEST 2.3: MANAGER LOGS CHECK-IN COMMENT
  // ==========================================
  console.log(bold("\n--- Test 2.3: Manager logs structured Check-in Comment ---"));

  // Log in as Manager Monica
  mockSession(testManager);

  let checkinSuccess = false;
  try {
    // Save check-in comment against the first goal of Joey for Q1
    await saveCheckIn(g1.id, "Q1", "Excellent work on sales revenue, Joey! The 80% progress score is impressive.");
    checkinSuccess = true;
  } catch (err: any) {
    console.error("Failed to save check-in:", err);
  }

  const savedCheckin = await prisma.checkIn.findFirst({
    where: { goalId: g1.id, quarter: "Q1" }
  });

  assertTest(
    "Test 2.3: Manager saves 1:1 check-in discussion notes",
    checkinSuccess && savedCheckin !== null && savedCheckin.managerComment.includes("80% progress score"),
    `Discussion comment successfully stored in DB:\n` +
    `      * Quarter: ${savedCheckin?.quarter}\n` +
    `      * Comment: "${savedCheckin?.managerComment}"\n` +
    `      * Date Recorded: ${savedCheckin?.checkinDate}`
  );


  // ==========================================
  // TEST 2.4: LOCKED QUARTER SECURITY
  // ==========================================
  console.log(bold("\n--- Test 2.4: Locked Quarter Data Integrity Lock ---"));

  // Log back in as Joey
  mockSession(employee1);

  // Attempt to edit achievement for Q1 (which is now locked because Monica saved Q1 check-in notes)
  let lockedEditBlocked = false;
  try {
    await updateAchievement(g1.id, "Q1", 900, "COMPLETED");
  } catch (err: any) {
    lockedEditBlocked = err.message.includes("This quarter check-in has been completed and is locked");
  }

  assertTest(
    "Test 2.4: Database locked quarter integrity constraint",
    lockedEditBlocked,
    `Blocked modification successfully. Thrown error: "This quarter check-in has been completed and is locked by your manager."`
  );


  // ==========================================
  // CLEANUP AND SUMMARY REPORT
  // ==========================================
  console.log(bold("\n--- Cleanup Testing Artifacts ---"));
  
  await prisma.checkIn.deleteMany({
    where: { goalId: { in: [g1.id, g2.id, g3.id, g4.id] } }
  });
  await prisma.achievement.deleteMany({
    where: { goalId: { in: [g1.id, g2.id, g3.id, g4.id] } }
  });
  await prisma.goal.deleteMany({
    where: { cycleId: testCycle.id }
  });
  await prisma.goalCycle.delete({
    where: { id: testCycle.id }
  });
  await prisma.user.deleteMany({
    where: { id: { in: [testManager.id, employee1.id] } }
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
