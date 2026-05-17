"use server";

import { GoalPhase, UoMType, ProgressStatus, GoalStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath as nextRevalidatePath } from "next/cache";
import { isPhaseActionAllowed } from "@/lib/schedule";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch (e: unknown) {
    const err = e as { message?: string };
    if (err && typeof err === "object" && err.message && err.message.includes("static generation store missing")) {
      // Ignore when running outside of Next.js server context (e.g. CLI test scripts)
      return;
    }
    throw e;
  }
}
import { sendEmail } from "@/lib/email";
import { sendTeamsNotification } from "./teams";

export async function createGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") {
    const allowed = await isPhaseActionAllowed("GOAL_SETTING");
    if (!allowed) {
      throw new Error("Goal creation is only allowed during the Goal Setting phase (starting May 1st).");
    }
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thrustArea = formData.get("thrustArea") as string;
  const uom = formData.get("uom") as string;
  const targetValue = formData.get("target") as string;
  const target = targetValue ? parseFloat(targetValue) : null;
  const weightage = parseInt(formData.get("weightage") as string, 10);
  const cycleId = formData.get("cycleId") as string;

  if (!title) throw new Error("Goal Title is required");
  if (!thrustArea) throw new Error("Thrust Area is required");
  if (!uom) throw new Error("Unit of Measure (UoM) is required");
  if (isNaN(weightage)) throw new Error("Weightage is required and must be a number");
  if (!cycleId) throw new Error("Cycle ID is missing");

  // Validate weightage constraints
  const existingGoals = await prisma.goal.findMany({
    where: { employeeId: session.user.id, cycleId },
  });

  const currentTotal = existingGoals.reduce((sum: number, g: { weightage: number }) => sum + g.weightage, 0);

  if (existingGoals.length >= 8) {
    throw new Error("Maximum 8 goals allowed per cycle");
  }
  if (weightage < 10) {
    throw new Error("Minimum weightage is 10%");
  }
  if (currentTotal + weightage > 100) {
    throw new Error(`Total weightage would exceed 100%. Current: ${currentTotal}%, Adding: ${weightage}%`);
  }

  await prisma.goal.create({
    data: {
      title,
      description,
      thrustArea,
      uom: uom as UoMType,
      target,
      weightage,
      status: "DRAFT",
      employeeId: session.user.id,
      cycleId,
    },
  });

  revalidatePath("/dashboard/goals");
}

export async function submitGoals(cycleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") {
    const allowed = await isPhaseActionAllowed("GOAL_SETTING");
    if (!allowed) {
      throw new Error("Goal submission is only allowed during the Goal Setting phase (starting May 1st).");
    }
  }

  const goals = await prisma.goal.findMany({
    where: { employeeId: session.user.id, cycleId },
  });

  const totalWeight = goals.reduce((sum: number, g: { weightage: number }) => sum + g.weightage, 0);
  if (totalWeight !== 100) {
    throw new Error(`Total weightage must be exactly 100%. Current: ${totalWeight}%`);
  }

  await prisma.goal.updateMany({
    where: {
      employeeId: session.user.id,
      cycleId,
      status: { in: ["DRAFT", "RETURNED"] }
    },
    data: { status: "SUBMITTED" },
  });

  const employee = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { manager: true }
  });

  if (employee?.manager) {
    await sendEmail({
      to: employee.manager.email,
      subject: `Action Required: Goals Submitted by ${employee.name}`,
      body: `${employee.name} has submitted their AtomQuest goals for approval. Please review them in your dashboard.`
    }).catch(e => console.error("Email failed:", e));

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const deepLinkUrl = `${appUrl}/dashboard/team/${employee.id}`;
    const activeCycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });

    await sendTeamsNotification({
      managerEmail: employee.manager.email,
      employeeName: employee.name,
      actionType: "SUBMITTED",
      cycleName: activeCycle?.name || "OKR Cycle",
      goalsCount: goals.length,
      deepLinkUrl
    }).catch(e => console.error("Teams alert failed:", e));
  }

  revalidatePath("/dashboard/goals");
}

export async function deleteGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") {
    const allowed = await isPhaseActionAllowed("GOAL_SETTING");
    if (!allowed) {
      throw new Error("Goal deletion is only allowed during the Goal Setting phase (starting May 1st).");
    }
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.employeeId !== session.user.id) throw new Error("Unauthorized");
  if (goal.status !== "DRAFT") throw new Error("Can only delete draft goals");
  if (goal.isShared) throw new Error("Cannot delete shared goals");

  await prisma.goal.delete({ where: { id: goalId } });
  revalidatePath("/dashboard/goals");
}

export async function editGoalAsEmployee(goalId: string, weightage: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") {
    const allowed = await isPhaseActionAllowed("GOAL_SETTING");
    if (!allowed) {
      throw new Error("Goal editing is only allowed during the Goal Setting phase (starting May 1st).");
    }
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.employeeId !== session.user.id) throw new Error("Unauthorized");
  if (goal.status !== "DRAFT" && goal.status !== "RETURNED") {
    throw new Error("Can only edit draft or returned goals");
  }

  if (weightage < 10) throw new Error("Minimum weightage is 10%");

  await prisma.goal.update({
    where: { id: goalId },
    data: { weightage },
  });

  revalidatePath("/dashboard/goals");
}

export async function approveGoals(employeeId: string, cycleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Unauthorized: Manager or Admin access required");
  }

  const goalsToApprove = await prisma.goal.findMany({
    where: { employeeId, cycleId, status: "SUBMITTED" },
  });

  await prisma.goal.updateMany({
    where: { employeeId, cycleId, status: "SUBMITTED" },
    data: { status: "LOCKED" },
  });

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (employee) {
    await sendEmail({
      to: employee.email,
      subject: `AtomQuest Goals Approved`,
      body: `Your goals for the current cycle have been approved and locked by your manager.`
    }).catch(e => console.error("Email failed:", e));
  }

  // Create audit logs
  if (goalsToApprove.length > 0) {
    await prisma.auditLog.createMany({
      data: goalsToApprove.map(g => ({
        goalId: g.id,
        field: "status",
        oldValue: "SUBMITTED",
        newValue: "LOCKED",
        changedBy: session.user?.id || "unknown"
      }))
    });
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/goals");
}

export async function returnGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Unauthorized: Manager or Admin access required");
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { employee: true } });
  if (!goal) throw new Error("Goal not found");

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "RETURNED" },
  });

  if (goal.employee) {
    await sendEmail({
      to: goal.employee.email,
      subject: `AtomQuest Goal Returned for Rework`,
      body: `Your manager has returned the goal "${goal.title}" for rework. Please update your weightages or targets and resubmit.`
    }).catch(e => console.error("Email failed:", e));
  }

  await prisma.auditLog.create({
    data: {
      goalId,
      field: "status",
      oldValue: "SUBMITTED",
      newValue: "RETURNED",
      changedBy: session.user.id
    }
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/goals");
}

export async function editGoalAsManager(goalId: string, target: number | null, weightage: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Unauthorized: Manager or Admin access required");
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error("Goal not found");
  if (goal.status !== "SUBMITTED") throw new Error("Only submitted goals can be edited");

  if (weightage < 10) throw new Error("Minimum weightage is 10%");

  await prisma.goal.update({
    where: { id: goalId },
    data: { target, weightage },
  });

  // Log changes
  if (goal.target !== target) {
    await prisma.auditLog.create({
      data: { goalId, field: "target", oldValue: goal.target?.toString(), newValue: target?.toString(), changedBy: session.user.id }
    });
  }
  if (goal.weightage !== weightage) {
    await prisma.auditLog.create({
      data: { goalId, field: "weightage", oldValue: goal.weightage.toString(), newValue: weightage.toString(), changedBy: session.user.id }
    });
  }

  revalidatePath("/dashboard/team");
}

export async function updateAchievement(
  goalId: string,
  quarter: string,
  actualValue: number,
  progressStatus: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error("Goal not found");

  const userRole = (session.user as { role?: string }).role;

  if (goal.isShared && userRole === "EMPLOYEE") {
    throw new Error("Shared goals are auto-synced and cannot be updated by employees");
  }

  if (!goal.isShared && goal.employeeId !== session.user.id && userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Unauthorized to update this goal");
  }

  // Enforce quarter locking & schedule window checks for employees
  if (userRole === "EMPLOYEE") {
    const allowed = await isPhaseActionAllowed(quarter as GoalPhase);
    if (!allowed) {
      throw new Error(`Achievement updates for ${quarter} are only allowed during its scheduled check-in window.`);
    }

    const checkinExists = await prisma.checkIn.findFirst({
      where: {
        quarter: quarter as GoalPhase,
        goal: {
          employeeId: goal.employeeId,
          cycleId: goal.cycleId,
        },
      },
    });

    if (checkinExists) {
      throw new Error("This quarter check-in has been completed and is locked by your manager.");
    }
  }

  // If the goal is shared, find all linked goals in the same cycle and update them all
  if (goal.isShared) {
    const linkedGoals = await prisma.goal.findMany({
      where: {
        title: goal.title,
        cycleId: goal.cycleId,
        isShared: true,
      },
    });

    for (const lg of linkedGoals) {
      const existing = await prisma.achievement.findFirst({
        where: { goalId: lg.id, quarter: quarter as GoalPhase },
      });

      if (existing) {
        await prisma.achievement.update({
          where: { id: existing.id },
          data: {
            actualValue,
            progressStatus: progressStatus as ProgressStatus,
            completionDate: progressStatus === "COMPLETED" ? new Date() : null,
          },
        });
      } else {
        await prisma.achievement.create({
          data: {
            goalId: lg.id,
            quarter: quarter as GoalPhase,
            actualValue,
            progressStatus: progressStatus as ProgressStatus,
            completionDate: progressStatus === "COMPLETED" ? new Date() : null,
          },
        });
      }
    }
  } else {
    // Standard single-goal update
    const existing = await prisma.achievement.findFirst({
      where: { goalId, quarter: quarter as GoalPhase },
    });

    if (existing) {
      await prisma.achievement.update({
        where: { id: existing.id },
        data: {
          actualValue,
          progressStatus: progressStatus as ProgressStatus,
          completionDate: progressStatus === "COMPLETED" ? new Date() : null,
        },
      });
    } else {
      await prisma.achievement.create({
        data: {
          goalId,
          quarter: quarter as GoalPhase,
          actualValue,
          progressStatus: progressStatus as ProgressStatus,
          completionDate: progressStatus === "COMPLETED" ? new Date() : null,
        },
      });
    }
  }

  revalidatePath("/dashboard/goals");
}

export async function saveCheckIn(
  goalId: string,
  quarter: string,
  comment: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Unauthorized: Manager or Admin access required");
  }

  await prisma.checkIn.create({
    data: {
      goalId,
      quarter: quarter as GoalPhase,
      managerComment: comment,
      managerId: session.user.id,
    },
  });

  revalidatePath("/dashboard/team");
}

export async function unlockGoalsAsAdmin(employeeEmail: string, cycleId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  const employee = await prisma.user.findUnique({ where: { email: employeeEmail } });
  if (!employee) throw new Error("Employee not found");

  const lockedGoals = await prisma.goal.findMany({
    where: { employeeId: employee.id, cycleId, status: "LOCKED" }
  });

  if (lockedGoals.length === 0) throw new Error("No locked goals found for this employee");

  await prisma.goal.updateMany({
    where: { employeeId: employee.id, cycleId, status: "LOCKED" },
    data: { status: "RETURNED" }, // Returned to employee for editing
  });

  // Audit log
  await prisma.auditLog.createMany({
    data: lockedGoals.map(g => ({
      goalId: g.id,
      field: "status",
      oldValue: "LOCKED",
      newValue: "RETURNED",
      changedBy: session.user?.id || "admin"
    }))
  });

  revalidatePath("/dashboard/admin");
}
export async function createCycle(name: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  // Deactivate all existing cycles first (system assumes one active cycle at a time)
  await prisma.goalCycle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  await prisma.goalCycle.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
      phase: "GOAL_SETTING",
    },
  });

  revalidatePath("/dashboard/admin");
}

export async function toggleCycleStatus(cycleId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  await prisma.goalCycle.update({
    where: { id: cycleId },
    data: { isActive },
  });

  revalidatePath("/dashboard/admin");
}

export async function pushSharedGoal(title: string, uom: string, target: number | null, departmentId: string, cycleId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  // Find all employees in the department
  const employees = await prisma.user.findMany({
    where: { departmentId, role: "EMPLOYEE" }
  });

  if (employees.length === 0) throw new Error("No employees found in this department");

  // Create a goal in each employee's sheet
  // Default weightage to 10 (minimum). They can adjust it before submission.
  const goalsToCreate = employees.map(emp => ({
    title,
    thrustArea: "Strategic Initiative",
    uom: uom as UoMType,
    target,
    weightage: 10,
    status: "DRAFT" as GoalStatus,
    employeeId: emp.id,
    cycleId,
    isShared: true,
    sharedFromId: session.user?.id
  }));

  await prisma.goal.createMany({
    data: goalsToCreate
  });

  revalidatePath("/dashboard/admin");
}

export async function updateUserManager(employeeId: string, managerId: string | null) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  await prisma.user.update({
    where: { id: employeeId },
    data: { managerId }
  });

  revalidatePath("/dashboard/admin");
}

export async function simulateEntraIDSync() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  // Find all employees without a manager
  const unassignedEmployees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", managerId: null }
  });

  if (unassignedEmployees.length === 0) {
    return { success: true, count: 0, message: "Hierarchy is already fully synchronized." };
  }

  // Get active managers
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" }
  });

  if (managers.length === 0) {
    throw new Error("Cannot sync: No active managers found in the system.");
  }

  // Simulate Azure AD matching algorithm: Assign evenly or based on department logic
  // For this simulation, we'll assign randomly to mimic external data sync
  let count = 0;
  for (const emp of unassignedEmployees) {
    const randomManager = managers[Math.floor(Math.random() * managers.length)];
    await prisma.user.update({
      where: { id: emp.id },
      data: { managerId: randomManager.id }
    });
    count++;
  }

  revalidatePath("/dashboard/admin");
  return { success: true, count, message: `Successfully synchronized ${count} employee(s) from Microsoft Entra ID.` };
}

export async function requestFeedbackAction(employeeId: string, subject: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found");

  await sendEmail({
    to: employee.email,
    subject: `AtomQuest: Feedback Requested by ${session.user.name} - ${subject}`,
    body: `Hello ${employee.name},\n\nYour manager, ${session.user.name}, has requested feedback on: "${subject}".\n\nManager's message:\n"${message}"\n\nPlease log in to the AtomQuest portal to review.`
  });

  return { success: true };
}

export async function triggerCheckInReminders(cycleId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      goals: {
        where: { cycleId },
        include: {
          checkIns: {
            where: { quarter: cycle.phase }
          }
        }
      }
    }
  });

  let reminderCount = 0;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  for (const emp of employees) {
    if (emp.goals.length > 0) {
      const pendingGoals = emp.goals.filter(g => g.checkIns.length === 0);
      if (pendingGoals.length > 0) {
        await sendEmail({
          to: emp.email,
          subject: `Reminder: Complete your ${cycle.phase} Check-in`,
          body: `Hi ${emp.name},\n\nThis is a friendly reminder to complete your check-ins and log actual achievements for the ${cycle.phase} quarter under the cycle "${cycle.name}".\n\nPlease navigate to the portal to update your actual achievement values against targets: ${appUrl}/dashboard/goals`
        }).catch(e => console.error(`Failed to send reminder to ${emp.email}:`, e));
        reminderCount++;
      }
    }
  }

  return { success: true, reminderCount };
}

export async function runEscalationEngine() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  // 1. Ensure dynamic escalation rules exist
  const defaultRules = [
    { triggerType: "GOAL_SUBMISSION_PENDING", daysLimit: 5 },
    { triggerType: "MANAGER_APPROVAL_PENDING", daysLimit: 3 },
    { triggerType: "CHECKIN_PENDING", daysLimit: 7 },
  ];

  for (const r of defaultRules) {
    const existing = await prisma.escalationRule.findFirst({
      where: { triggerType: r.triggerType }
    });
    if (!existing) {
      await prisma.escalationRule.create({
        data: { triggerType: r.triggerType, daysLimit: r.daysLimit }
      });
    }
  }

  const rules = await prisma.escalationRule.findMany();
  const submissionRule = rules.find(r => r.triggerType === "GOAL_SUBMISSION_PENDING")!;
  const approvalRule = rules.find(r => r.triggerType === "MANAGER_APPROVAL_PENDING")!;
  const checkinRule = rules.find(r => r.triggerType === "CHECKIN_PENDING")!;

  // 2. Fetch the active cycle
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true }
  });
  if (!activeCycle) {
    return { success: true, processedCount: 0, message: "No active cycle found to evaluate escalations." };
  }

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  let processedCount = 0;

  // Fetch all employees with managers
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      manager: true,
      goals: {
        where: { cycleId: activeCycle.id },
        include: {
          checkIns: {
            where: { quarter: activeCycle.phase }
          }
        }
      }
    }
  });

  const today = new Date();

  for (const emp of employees) {
    try {
      // -------------------------------------------------------------
      // RULE 1: GOAL_SUBMISSION_PENDING (Employee has not submitted goals within N days)
      // -------------------------------------------------------------
      const hasSubmitted = emp.goals.length > 0 && emp.goals.every(g => g.status !== "DRAFT" && g.status !== "RETURNED");
      const submissionOpenDays = Math.max(0, Math.floor((today.getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)));

      const submissionEscLog = await prisma.escalationLog.findFirst({
        where: { employeeId: emp.id, ruleId: submissionRule.id, status: { in: ["PENDING", "ESCALATED"] } }
      });

      if (!hasSubmitted) {
        let targetLevel = 0;
        if (submissionOpenDays >= submissionRule.daysLimit * 3) {
          targetLevel = 3; // HR alert
        } else if (submissionOpenDays >= submissionRule.daysLimit * 2) {
          targetLevel = 2; // Manager alert
        } else if (submissionOpenDays >= submissionRule.daysLimit) {
          targetLevel = 1; // Employee alert
        }

        if (targetLevel > 0) {
          processedCount++;
          let details = "";

          if (targetLevel === 1) {
            details = `Level 1: Goal submission pending for ${submissionOpenDays} days. Employee alerted.`;
            await sendEmail({
              to: emp.email,
              subject: `⚠️ Escalation Level 1: AtomQuest Goal Submission Pending`,
              body: `Hi ${emp.name},\n\nYou have not submitted your AtomQuest goal sheet for the cycle "${activeCycle.name}". Please log in and submit your goals as soon as possible: ${appUrl}/dashboard/goals`
            }).catch(e => console.error(e));
          } else if (targetLevel === 2) {
            details = `Level 2: Goal submission pending for ${submissionOpenDays} days. Manager alerted.`;
            if (emp.manager) {
              await sendEmail({
                to: emp.manager.email,
                subject: `⚠️ Escalation Level 2: Goal Submission Overdue for ${emp.name}`,
                body: `Hello Manager,\n\nYour subordinate ${emp.name} has not submitted their goal sheet for "${activeCycle.name}" within ${submissionOpenDays} days. Please discuss and have them complete it: ${appUrl}/dashboard/team/${emp.id}`
              }).catch(e => console.error(e));
            }
          } else {
            details = `Level 3: Goal submission overdue for ${submissionOpenDays} days. HR / Skip-Level escalated.`;
            await sendEmail({
              to: "hr@atomberg.com",
              subject: `🚨 Escalation Level 3: Goal Submission Overdue for ${emp.name}`,
              body: `Hello HR,\n\nEmployee ${emp.name} has not submitted their goals for "${activeCycle.name}" after multiple alerts (${submissionOpenDays} days overdue). Skip-level / HR intervention requested.`
            }).catch(e => console.error(e));
          }

          if (submissionEscLog) {
            if (submissionEscLog.level !== targetLevel) {
              await prisma.escalationLog.update({
                where: { id: submissionEscLog.id },
                data: { level: targetLevel, status: targetLevel > 1 ? "ESCALATED" : "PENDING", details }
              });
            }
          } else {
            await prisma.escalationLog.create({
              data: { employeeId: emp.id, ruleId: submissionRule.id, level: targetLevel, status: targetLevel > 1 ? "ESCALATED" : "PENDING", details }
            });
          }
        }
      } else {
        if (submissionEscLog) {
          await prisma.escalationLog.update({
            where: { id: submissionEscLog.id },
            data: { status: "RESOLVED", resolvedAt: today }
          });
        }
      }

      // -------------------------------------------------------------
      // RULE 2: MANAGER_APPROVAL_PENDING (Manager hasn't approved goals within N days)
      // -------------------------------------------------------------
      const hasSubmittedPendingApproval = emp.goals.length > 0 && emp.goals.some(g => g.status === "SUBMITTED");
      const lastGoalSubmitDate = emp.goals.length > 0 ? new Date(Math.max(...emp.goals.map(g => new Date(g.updatedAt).getTime()))) : today;
      const approvalOpenDays = Math.max(0, Math.floor((today.getTime() - lastGoalSubmitDate.getTime()) / (1000 * 60 * 60 * 24)));

      const approvalEscLog = await prisma.escalationLog.findFirst({
        where: { employeeId: emp.id, ruleId: approvalRule.id, status: { in: ["PENDING", "ESCALATED"] } }
      });

      if (hasSubmittedPendingApproval) {
        let targetLevel = 0;
        if (approvalOpenDays >= approvalRule.daysLimit * 2) {
          targetLevel = 2; // HR alert
        } else if (approvalOpenDays >= approvalRule.daysLimit) {
          targetLevel = 1; // Manager alert
        }

        if (targetLevel > 0) {
          processedCount++;
          let details = "";

          if (targetLevel === 1) {
            details = `Level 1: Manager approval pending for ${approvalOpenDays} days. Manager alerted.`;
            if (emp.manager) {
              await sendEmail({
                to: emp.manager.email,
                subject: `⚠️ Escalation Level 1: Subordinate Approval Pending`,
                body: `Hello Manager,\n\nYou have not approved the goals submitted by ${emp.name} for "${activeCycle.name}" within ${approvalOpenDays} days. Please review and lock their goals: ${appUrl}/dashboard/team/${emp.id}`
              }).catch(e => console.error(e));
            }
          } else {
            details = `Level 2: Manager approval overdue for ${approvalOpenDays} days. HR / Skip-Level escalated.`;
            await sendEmail({
              to: "hr@atomberg.com",
              subject: `🚨 Escalation Level 2: Manager Goal Approval Overdue for ${emp.name}`,
              body: `Hello HR,\n\nManager ${emp.manager?.name || "N/A"} has not approved the goal sheet submitted by ${emp.name} after ${approvalOpenDays} days. Intervention is required.`
            }).catch(e => console.error(e));
          }

          if (approvalEscLog) {
            if (approvalEscLog.level !== targetLevel) {
              await prisma.escalationLog.update({
                where: { id: approvalEscLog.id },
                data: { level: targetLevel, status: "ESCALATED", details }
              });
            }
          } else {
            await prisma.escalationLog.create({
              data: { employeeId: emp.id, ruleId: approvalRule.id, level: targetLevel, status: targetLevel > 1 ? "ESCALATED" : "PENDING", details }
            });
          }
        }
      } else {
        if (approvalEscLog) {
          await prisma.escalationLog.update({
            where: { id: approvalEscLog.id },
            data: { status: "RESOLVED", resolvedAt: today }
          });
        }
      }

      // -------------------------------------------------------------
      // RULE 3: CHECKIN_PENDING (Quarterly check-in not completed in window)
      // -------------------------------------------------------------
      const hasGoalsLocked = emp.goals.length > 0 && emp.goals.every(g => g.status === "LOCKED");
      const checkinCompleted = emp.goals.length > 0 && emp.goals.every(g => g.checkIns.length > 0);
      const checkinOpenDays = Math.max(0, Math.floor((today.getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)));

      const checkinEscLog = await prisma.escalationLog.findFirst({
        where: { employeeId: emp.id, ruleId: checkinRule.id, status: { in: ["PENDING", "ESCALATED"] } }
      });

      if (hasGoalsLocked && !checkinCompleted) {
        let targetLevel = 0;
        if (checkinOpenDays >= checkinRule.daysLimit * 3) {
          targetLevel = 3; // HR alert
        } else if (checkinOpenDays >= checkinRule.daysLimit * 2) {
          targetLevel = 2; // Manager alert
        } else if (checkinOpenDays >= checkinRule.daysLimit) {
          targetLevel = 1; // Employee alert
        }

        if (targetLevel > 0) {
          processedCount++;
          let details = "";

          if (targetLevel === 1) {
            details = `Level 1: Quarterly ${activeCycle.phase} check-in pending for ${checkinOpenDays} days. Employee alerted.`;
            await sendEmail({
              to: emp.email,
              subject: `⚠️ Escalation Level 1: Quarterly ${activeCycle.phase} Check-in Overdue`,
              body: `Hi ${emp.name},\n\nPlease complete your check-ins and achievement capture for ${activeCycle.phase} under "${activeCycle.name}" immediately: ${appUrl}/dashboard/goals`
            }).catch(e => console.error(e));
          } else if (targetLevel === 2) {
            details = `Level 2: Quarterly ${activeCycle.phase} check-in pending for ${checkinOpenDays} days. Manager alerted.`;
            if (emp.manager) {
              await sendEmail({
                to: emp.manager.email,
                subject: `⚠️ Escalation Level 2: Check-in Overdue for ${emp.name}`,
                body: `Hello Manager,\n\nYour 1:1 check-in and comments with ${emp.name} for ${activeCycle.phase} are overdue by ${checkinOpenDays} days. Please log them: ${appUrl}/dashboard/checkins`
              }).catch(e => console.error(e));
            }
          } else {
            details = `Level 3: Quarterly ${activeCycle.phase} check-in overdue for ${checkinOpenDays} days. HR alerted.`;
            await sendEmail({
              to: "hr@atomberg.com",
              subject: `🚨 Escalation Level 3: Quarterly Check-in Overdue for ${emp.name}`,
              body: `Hello HR,\n\nCheck-in for employee ${emp.name} and manager ${emp.manager?.name || "N/A"} remains incomplete for ${activeCycle.phase} after ${checkinOpenDays} days. Intervention is required.`
            }).catch(e => console.error(e));
          }

          if (checkinEscLog) {
            if (checkinEscLog.level !== targetLevel) {
              await prisma.escalationLog.update({
                where: { id: checkinEscLog.id },
                data: { level: targetLevel, status: targetLevel > 1 ? "ESCALATED" : "PENDING", details }
              });
            }
          } else {
            await prisma.escalationLog.create({
              data: { employeeId: emp.id, ruleId: checkinRule.id, level: targetLevel, status: targetLevel > 1 ? "ESCALATED" : "PENDING", details }
            });
          }
        }
      } else {
        if (checkinEscLog) {
          await prisma.escalationLog.update({
            where: { id: checkinEscLog.id },
            data: { status: "RESOLVED", resolvedAt: today }
          });
        }
      }
    } catch (err) {
      console.error(`[Escalation Engine Warning] Failed to process escalations for employee ${emp.name} (${emp.id}):`, err);
    }
  }

  revalidatePath("/dashboard/admin");
  return { success: true, processedCount, message: `Successfully evaluated escalation engine rules. Processed ${processedCount} active escalations.` };
}

export async function updateEscalationRuleDays(triggerType: string, daysLimit: number) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  await prisma.escalationRule.updateMany({
    where: { triggerType },
    data: { daysLimit }
  });

  revalidatePath("/dashboard/admin");
  return { success: true, message: `Successfully updated escalation threshold to ${daysLimit} days.` };
}


