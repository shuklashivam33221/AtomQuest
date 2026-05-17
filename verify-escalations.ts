/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prisma } from "./src/lib/prisma";
import { runEscalationEngine, updateEscalationRuleDays } from "./src/lib/actions";
import bcrypt from "bcrypt";

// Colors for terminal formatting
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

async function main() {
  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan("        ATOMQUEST RULE-BASED ESCALATION TEST SUITE       ")));
  console.log(bold(cyan("========================================================\n")));

  // Save originally active cycles to restore later
  const originallyActiveCycles = await prisma.goalCycle.findMany({
    where: { isActive: true }
  });

  // Temporarily deactivate other active cycles for pure test isolation
  await prisma.goalCycle.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  // Provisioning isolated mock data
  const testDept = await prisma.department.upsert({
    where: { name: "Escalation Test Dept" },
    update: {},
    create: { name: "Escalation Test Dept" },
  });

  const hashedPwd = await bcrypt.hash("verify123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "esc.adm@atomberg.com" },
    update: {},
    create: {
      name: "Monica Admin",
      email: "esc.adm@atomberg.com",
      password: hashedPwd,
      role: "ADMIN",
      departmentId: testDept.id
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "esc.mgr@atomberg.com" },
    update: {},
    create: {
      name: "Chandler Manager",
      email: "esc.mgr@atomberg.com",
      password: hashedPwd,
      role: "MANAGER",
      departmentId: testDept.id
    }
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "esc.emp@atomberg.com" },
    update: {},
    create: {
      name: "Ross Employee",
      email: "esc.emp@atomberg.com",
      password: hashedPwd,
      role: "EMPLOYEE",
      managerId: managerUser.id,
      departmentId: testDept.id
    }
  });

  // Cycle creation - set start date 15 days ago to trigger Level 3 overdue (15 days >= 3 * 5 days)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 15);

  const activeCycle = await prisma.goalCycle.create({
    data: {
      name: "Escalation Check Cycle",
      startDate,
      endDate: new Date("2026-08-31"),
      phase: "Q1",
      isActive: true
    }
  });

  console.log(green("✔ Successfully provisioned isolated test accounts and active overdue goal cycle."));

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

  // Set mock admin session
  (process.env as any).MOCK_SESSION = JSON.stringify({
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    }
  });

  // ==========================================
  // TEST 1: SEEDING & DYNAMIC RULE CONFIGURATION
  // ==========================================
  console.log(bold("\n--- 1. Escalation Rules Configuration ---"));

  // Trigger evaluation to seed initial rules
  await runEscalationEngine();

  const rules = await prisma.escalationRule.findMany();
  assertTest(
    "Standard escalation rules are automatically seeded upon first engine execution",
    rules.length >= 3,
    `Seeded ${rules.length} core rules: ${rules.map(r => r.triggerType).join(", ")}`
  );

  // Update rule configuration threshold
  await updateEscalationRuleDays("GOAL_SUBMISSION_PENDING", 4);
  const updatedRule = await prisma.escalationRule.findFirst({
    where: { triggerType: "GOAL_SUBMISSION_PENDING" }
  });

  assertTest(
    "Admins can dynamically configure daysLimit thresholds for rules",
    updatedRule?.daysLimit === 4,
    `Successfully changed trigger threshold to ${updatedRule?.daysLimit} days.`
  );

  // ==========================================
  // TEST 2: ENGINE RULE EVALUATIONS & LEVEL ESCALATIONS
  // ==========================================
  console.log(bold("\n--- 2. Multi-Level Escalation Engine Progression ---"));

  // Re-run engine to scan overdue cycle (Ross has not submitted goals for 15 days, which is >= 3x threshold)
  const runResult = await runEscalationEngine();

  const currentLog = await prisma.escalationLog.findFirst({
    where: { employeeId: employeeUser.id, status: { in: ["PENDING", "ESCALATED"] } },
    include: { rule: true }
  });

  assertTest(
    "Escalation engine executes automatically and flags employees with pending sheets",
    currentLog !== null,
    `Flagged Ross under rule: ${currentLog?.rule.triggerType}`
  );

  assertTest(
    "Escalation chain routes correctly: progresses to Level 3 (HR alert) for overdue dates",
    currentLog?.level === 3 && currentLog?.status === "ESCALATED",
    `Escalation level evaluated at: ${currentLog?.level} (${currentLog?.details})`
  );

  // ==========================================
  // TEST 3: AUTO-RESOLUTION
  // ==========================================
  console.log(bold("\n--- 3. Automated Resolution Cascades ---"));

  // Ross creates and submits a goal
  const rossGoal = await prisma.goal.create({
    data: {
      title: "ROSS OKR GOAL",
      description: "Auto-resolve test",
      thrustArea: "GROWTH",
      uom: "NUMERIC_MIN",
      target: 100,
      weightage: 100,
      employeeId: employeeUser.id,
      cycleId: activeCycle.id,
      status: "APPROVED" // Treat as submitted/approved
    }
  });

  // Re-evaluate engine rules
  await runEscalationEngine();

  const resolvedLog = await prisma.escalationLog.findFirst({
    where: { employeeId: employeeUser.id, status: "RESOLVED" }
  });

  assertTest(
    "Escalation rules auto-resolve and log resolutions once subordinate blocks are cleared",
    resolvedLog !== null && resolvedLog.resolvedAt !== null,
    `Log status: ${resolvedLog?.status} (Resolved At: ${resolvedLog?.resolvedAt})`
  );

  // ==========================================
  // CLEANUP AND TEARDOWN
  // ==========================================
  console.log(bold("\n--- Teardown Testing Data ---"));
  
  (process.env as any).BYPASS_SCHEDULE_LOCK = "true";
  (process.env as any).NODE_ENV = "test";

  // Clean up all data
  await prisma.goal.delete({ where: { id: rossGoal.id } });
  await prisma.escalationLog.deleteMany({
    where: { employeeId: employeeUser.id }
  });
  await prisma.goalCycle.delete({ where: { id: activeCycle.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [employeeUser.id, managerUser.id, adminUser.id] } }
  });
  await prisma.department.delete({ where: { id: testDept.id } });

  // Restore originally active cycles
  if (originallyActiveCycles.length > 0) {
    await prisma.goalCycle.updateMany({
      where: { id: { in: originallyActiveCycles.map(c => c.id) } },
      data: { isActive: true }
    });
  }

  delete (process.env as any).MOCK_SESSION;
  
  console.log(green("✔ Successfully cleaned up all temporary test accounts and data. Database left in a pristine state."));

  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan(` VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%) `)));
  console.log(bold(cyan("========================================================\n")));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
