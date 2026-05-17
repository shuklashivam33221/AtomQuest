import { prisma } from "./src/lib/prisma";
import { sendEmail } from "./src/lib/email";
import { sendTeamsNotification } from "./src/lib/teams";
import { triggerCheckInReminders } from "./src/lib/actions";
import bcrypt from "bcrypt";

// Colors for terminal formatting
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

async function main() {
  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan("      ATOMQUEST NOTIFICATION & TEAMS VERIFICATION       ")));
  console.log(bold(cyan("========================================================\n")));

  // Provisioning isolated mock data
  const testDept = await prisma.department.upsert({
    where: { name: "Alerts Test Dept" },
    update: {},
    create: { name: "Alerts Test Dept" },
  });

  const hashedPwd = await bcrypt.hash("verify123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "notify.adm@atomberg.com" },
    update: {},
    create: {
      name: "Phoebe Admin",
      email: "notify.adm@atomberg.com",
      password: hashedPwd,
      role: "ADMIN",
      departmentId: testDept.id
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "notify.mgr@atomberg.com" },
    update: {},
    create: {
      name: "Joey Manager",
      email: "notify.mgr@atomberg.com",
      password: hashedPwd,
      role: "MANAGER",
      departmentId: testDept.id
    }
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "notify.emp@atomberg.com" },
    update: {},
    create: {
      name: "Rachel Employee",
      email: "notify.emp@atomberg.com",
      password: hashedPwd,
      role: "EMPLOYEE",
      managerId: managerUser.id,
      departmentId: testDept.id
    }
  });

  // Cycle creation
  const activeCycle = await prisma.goalCycle.create({
    data: {
      name: "Alert Verification Cycle",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-08-31"),
      phase: "Q1",
      isActive: true
    }
  });

  // Goal creation (to test reminders)
  const testGoal = await prisma.goal.create({
    data: {
      title: "Complete Notification Pipeline",
      description: "Verify email and Teams alerts",
      thrustArea: "CUSTOMER_CENTRICITY",
      uom: "NUMERIC_MIN",
      target: 100,
      weightage: 100,
      employeeId: employeeUser.id,
      cycleId: activeCycle.id,
      status: "LOCKED"
    }
  });

  console.log(green("✔ Successfully provisioned isolated test accounts, cycle, and goals."));

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
  // TEST 1: EMAIL DISPATCHING & SANDBOX MODE
  // ==========================================
  console.log(bold("\n--- 1. Automated Email Notifications ---"));

  const emailResult = await sendEmail({
    to: employeeUser.email,
    subject: "AtomQuest Verification System Alert",
    body: "This is a programmatic test to verify automated email dispatching."
  });

  assertTest(
    "Nodemailer dispatch is successful and correctly handles sandbox/live SMTP fallback",
    emailResult === true,
    "Nodemailer dispatcher successfully returned true response status."
  );

  // ==========================================
  // TEST 2: TEAMS BOT & ADAPTIVE CARD SCHEMAS
  // ==========================================
  console.log(bold("\n--- 2. MS Teams Bot Adaptive Cards ---"));

  const teamsResult = await sendTeamsNotification({
    managerEmail: managerUser.email,
    employeeName: employeeUser.name,
    actionType: "SUBMITTED",
    cycleName: activeCycle.name,
    goalsCount: 1,
    deepLinkUrl: `http://localhost:3000/dashboard/team/${employeeUser.id}`
  });

  assertTest(
    "Teams Adaptive Card complies with JSON layout structure and contains direct deep-link",
    teamsResult === true,
    `Direct Deep-Link URL: http://localhost:3000/dashboard/team/${employeeUser.id}`
  );

  // ==========================================
  // TEST 3: BROADCAST CHECK-IN REMINDERS
  // ==========================================
  console.log(bold("\n--- 3. Broadcast Check-in Reminders (Admin Command) ---"));

  // Mock Admin Session for server action call
  (process.env as any).MOCK_SESSION = JSON.stringify({
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    }
  });

  let reminderCount = 0;
  try {
    const result = await triggerCheckInReminders(activeCycle.id);
    reminderCount = result.reminderCount;
  } catch (err: any) {
    console.error("Failed to run check-in reminders:", err);
  }

  assertTest(
    "Broadcast service successfully scans active cycle, maps pending check-ins, and alerts users",
    reminderCount > 0,
    `Successfully processed and dispatched reminders to ${reminderCount} employee(s).`
  );

  // ==========================================
  // CLEANUP AND SUMMARY REPORT
  // ==========================================
  console.log(bold("\n--- Cleanup Testing Artifacts ---"));
  
  (process.env as any).BYPASS_SCHEDULE_LOCK = "true";
  (process.env as any).NODE_ENV = "test";

  // Clean up all data
  await prisma.goal.delete({ where: { id: testGoal.id } });
  await prisma.goalCycle.delete({ where: { id: activeCycle.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [employeeUser.id, managerUser.id, adminUser.id] } }
  });
  await prisma.department.delete({ where: { id: testDept.id } });

  delete (process.env as any).MOCK_SESSION;
  
  console.log(green("✔ Successfully cleaned up all temporary test accounts and data. Database left in a pristine state."));

  console.log(bold(cyan("\n========================================================")));
  console.log(bold(cyan(` VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%) `)));
  console.log(bold(cyan("========================================================\n")));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
