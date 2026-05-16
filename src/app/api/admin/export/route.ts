import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeProgressScore } from "@/lib/scoring";
import { UoMType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch all locked goals and their achievements
  const goals = await prisma.goal.findMany({
    where: { status: "LOCKED" },
    include: {
      employee: { select: { name: true, role: true } },
      cycle: { select: { name: true } },
      achievements: true,
    },
    orderBy: { employee: { name: "asc" } },
  });

  // CSV Header
  let csv = "Employee Name,Role,Cycle,Goal Title,Thrust Area,UoM,Weightage (%),Target,Q1 Actual,Q1 Score (%),Q1 Status,Q2 Actual,Q2 Score (%),Q2 Status,Q3 Actual,Q3 Score (%),Q3 Status,Q4 Actual,Q4 Score (%),Q4 Status\n";

  // CSV Rows
  for (const goal of goals) {
    const row = [
      `"${goal.employee.name}"`,
      `"${goal.employee.role}"`,
      `"${goal.cycle.name}"`,
      `"${goal.title.replace(/"/g, '""')}"`,
      `"${goal.thrustArea}"`,
      `"${goal.uom}"`,
      goal.weightage,
      goal.target ?? "",
    ];

    // For each quarter, get actual, score, and status
    for (const quarter of ["Q1", "Q2", "Q3", "Q4"]) {
      const ach = goal.achievements.find(a => a.quarter === quarter);
      if (ach) {
        const score = computeProgressScore(goal.uom as UoMType, goal.target, ach.actualValue, ach.progressStatus);
        row.push(ach.actualValue ?? "");
        row.push(Math.round(score));
        row.push(ach.progressStatus);
      } else {
        row.push("");
        row.push("");
        row.push("NOT_STARTED");
      }
    }

    csv += row.join(",") + "\n";
  }

  const response = new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="AtomQuest_Achievement_Report.csv"',
    },
  });

  return response;
}
