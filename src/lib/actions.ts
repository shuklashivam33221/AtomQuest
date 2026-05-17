"use server";

import { GoalPhase, UoMType, ProgressStatus, GoalStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  const goals = await prisma.goal.findMany({
    where: { employeeId: session.user.id, cycleId, status: "DRAFT" },
  });

  const totalWeight = goals.reduce((sum: number, g: { weightage: number }) => sum + g.weightage, 0);
  if (totalWeight !== 100) {
    throw new Error(`Total weightage must be exactly 100%. Current: ${totalWeight}%`);
  }

  await prisma.goal.updateMany({
    where: { employeeId: session.user.id, cycleId, status: "DRAFT" },
    data: { status: "SUBMITTED" },
  });

  revalidatePath("/dashboard/goals");
}

export async function deleteGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  const goalsToApprove = await prisma.goal.findMany({
    where: { employeeId, cycleId, status: "SUBMITTED" },
  });

  await prisma.goal.updateMany({
    where: { employeeId, cycleId, status: "SUBMITTED" },
    data: { status: "LOCKED" },
  });

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

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "RETURNED" },
  });

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

  revalidatePath("/dashboard/goals");
}

export async function saveCheckIn(
  goalId: string,
  quarter: string,
  comment: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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
