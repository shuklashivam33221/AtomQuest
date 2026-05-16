"use server";

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
  const target = parseFloat(formData.get("target") as string) || null;
  const weightage = parseInt(formData.get("weightage") as string, 10);
  const cycleId = formData.get("cycleId") as string;

  if (!title || !thrustArea || !uom || !weightage || !cycleId) {
    throw new Error("Missing required fields");
  }

  // Validate weightage constraints
  const existingGoals = await prisma.goal.findMany({
    where: { employeeId: session.user.id, cycleId },
  });

  const currentTotal = existingGoals.reduce((sum: number, g: any) => sum + g.weightage, 0);
  
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
      uom: uom as any,
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

  const totalWeight = goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
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

  await prisma.goal.delete({ where: { id: goalId } });
  revalidatePath("/dashboard/goals");
}

export async function approveGoals(employeeId: string, cycleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.goal.updateMany({
    where: { employeeId, cycleId, status: "SUBMITTED" },
    data: { status: "LOCKED" },
  });

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

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/goals");
}

export async function updateAchievement(
  goalId: string,
  quarter: string,
  actualValue: number,
  progressStatus: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.achievement.findFirst({
    where: { goalId, quarter: quarter as any },
  });

  if (existing) {
    await prisma.achievement.update({
      where: { id: existing.id },
      data: {
        actualValue,
        progressStatus: progressStatus as any,
        completionDate: progressStatus === "COMPLETED" ? new Date() : null,
      },
    });
  } else {
    await prisma.achievement.create({
      data: {
        goalId,
        quarter: quarter as any,
        actualValue,
        progressStatus: progressStatus as any,
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
      quarter: quarter as any,
      managerComment: comment,
      managerId: session.user.id,
    },
  });

  revalidatePath("/dashboard/team");
}
