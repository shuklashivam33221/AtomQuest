import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Target, TrendingUp, BarChart3, Users } from "lucide-react";
import styles from "./analytics.module.css";
import AnalyticsCharts from "./AnalyticsCharts";

export const metadata = {
  title: "Analytics - AtomQuest",
  description: "Organization-wide goal achievement analytics, trends, and manager effectiveness insights.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    redirect("/dashboard");
  }

  // ── Fetch all data in parallel ──
  const [
    allGoals,
    allAchievements,
    allCheckIns,
    allUsers,
    allDepartments,
    allCycles,
  ] = await Promise.all([
    prisma.goal.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: { select: { name: true } },
            managerId: true,
          },
        },
        cycle: { select: { name: true, phase: true } },
      },
    }),
    prisma.achievement.findMany({
      include: {
        goal: {
          select: {
            id: true,
            target: true,
            uom: true,
            weightage: true,
            employeeId: true,
            employee: {
              select: {
                departmentId: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.checkIn.findMany({
      select: {
        id: true,
        goalId: true,
        quarter: true,
        managerId: true,
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        managerId: true,
        departmentId: true,
        department: { select: { name: true } },
      },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.goalCycle.findMany({
      orderBy: { startDate: "asc" },
      select: { id: true, name: true, phase: true },
    }),
  ]);

  // ── KPI Calculations ──
  const totalEmployees = allUsers.filter(u => u.role === "EMPLOYEE").length;
  const totalGoals = allGoals.length;
  const lockedGoals = allGoals.filter(g => g.status === "LOCKED").length;
  const overallCompletionRate = totalGoals > 0 ? Math.round((lockedGoals / totalGoals) * 100) : 0;
  const employeesWithGoals = new Set(allGoals.map(g => g.employeeId)).size;
  const avgGoalsPerEmployee = employeesWithGoals > 0 ? Math.round((totalGoals / employeesWithGoals) * 10) / 10 : 0;

  // ── 1. QoQ Achievement Trends ──
  const quarterOrder = ["Q1", "Q2", "Q3", "Q4"];
  const qoqMap = new Map<string, { scores: number[]; count: number }>();

  for (const achievement of allAchievements) {
    const quarter = achievement.quarter;
    const goal = achievement.goal;
    if (!goal || achievement.actualValue === null || achievement.actualValue === undefined) continue;

    let score = 0;
    const target = goal.target;
    const actual = achievement.actualValue;

    if (target && target > 0) {
      if (goal.uom === "NUMERIC_MIN" || goal.uom === "PERCENTAGE_MIN") {
        score = Math.min((actual / target) * 100, 100);
      } else if (goal.uom === "NUMERIC_MAX" || goal.uom === "PERCENTAGE_MAX") {
        score = actual > 0 ? Math.min((target / actual) * 100, 100) : 0;
      } else if (goal.uom === "ZERO") {
        score = actual === 0 ? 100 : 0;
      } else {
        score = Math.min((actual / target) * 100, 100);
      }
    }

    if (!qoqMap.has(quarter)) {
      qoqMap.set(quarter, { scores: [], count: 0 });
    }
    const entry = qoqMap.get(quarter)!;
    entry.scores.push(score);
    entry.count++;
  }

  const qoqTrends = quarterOrder
    .filter(q => qoqMap.has(q))
    .map(q => {
      const entry = qoqMap.get(q)!;
      const avg = entry.scores.length > 0
        ? Math.round(entry.scores.reduce((s, v) => s + v, 0) / entry.scores.length)
        : 0;
      return { quarter: q, avgScore: avg, totalGoals: entry.count };
    });

  // If no achievement data yet, show cycle phases as placeholder
  if (qoqTrends.length === 0) {
    for (const cycle of allCycles) {
      const phase = cycle.phase;
      if (quarterOrder.includes(phase)) {
        const goalsInPhase = allGoals.filter(g => g.cycleId === cycle.id).length;
        qoqTrends.push({ quarter: `${phase} (${cycle.name})`, avgScore: 0, totalGoals: goalsInPhase });
      }
    }
  }

  // ── 2. Department Completion Rates ──
  const deptCompletionMap = new Map<string, { draft: number; submitted: number; locked: number; returned: number; total: number }>();

  for (const dept of allDepartments) {
    deptCompletionMap.set(dept.name, { draft: 0, submitted: 0, locked: 0, returned: 0, total: 0 });
  }

  // Add an "Unassigned" bucket for employees without a department
  deptCompletionMap.set("Unassigned", { draft: 0, submitted: 0, locked: 0, returned: 0, total: 0 });

  for (const goal of allGoals) {
    const deptName = goal.employee.department?.name || "Unassigned";
    if (!deptCompletionMap.has(deptName)) {
      deptCompletionMap.set(deptName, { draft: 0, submitted: 0, locked: 0, returned: 0, total: 0 });
    }
    const entry = deptCompletionMap.get(deptName)!;
    entry.total++;
    if (goal.status === "LOCKED") entry.locked++;
    else if (goal.status === "SUBMITTED") entry.submitted++;
    else if (goal.status === "RETURNED") entry.returned++;
    else entry.draft++;
  }

  const departmentCompletion = Array.from(deptCompletionMap.entries())
    .filter(([, v]) => v.total > 0)
    .map(([department, v]) => ({ department, ...v }))
    .sort((a, b) => b.total - a.total);

  // ── 3. Goal Distribution Analysis ──
  // By Thrust Area
  const thrustMap = new Map<string, number>();
  for (const goal of allGoals) {
    thrustMap.set(goal.thrustArea, (thrustMap.get(goal.thrustArea) || 0) + 1);
  }
  const thrustAreaBreakdown = Array.from(thrustMap.entries())
    .map(([thrustArea, count]) => ({ thrustArea, count }))
    .sort((a, b) => b.count - a.count);

  // By UoM
  const uomMap = new Map<string, number>();
  for (const goal of allGoals) {
    uomMap.set(goal.uom, (uomMap.get(goal.uom) || 0) + 1);
  }
  const uomBreakdown = Array.from(uomMap.entries())
    .map(([uom, count]) => ({ uom, count }))
    .sort((a, b) => b.count - a.count);

  // By Status
  const statusMap = new Map<string, number>();
  for (const goal of allGoals) {
    statusMap.set(goal.status, (statusMap.get(goal.status) || 0) + 1);
  }
  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // ── 4. Manager Effectiveness ──
  const managers = allUsers.filter(u => u.role === "MANAGER");
  const managerEffectiveness = managers.map(mgr => {
    const subordinates = allUsers.filter(u => u.managerId === mgr.id);
    const subordinateIds = new Set(subordinates.map(s => s.id));
    const teamGoals = allGoals.filter(g => subordinateIds.has(g.employeeId));
    const lockedTeamGoals = teamGoals.filter(g => g.status === "LOCKED").length;
    const teamGoalIds = new Set(teamGoals.map(g => g.id));
    const checkInsForTeam = allCheckIns.filter(c => teamGoalIds.has(c.goalId));

    const approvalRate = teamGoals.length > 0 ? Math.round((lockedTeamGoals / teamGoals.length) * 100) : 0;
    const checkinRate = teamGoals.length > 0 ? Math.round((checkInsForTeam.length / teamGoals.length) * 100) : 0;

    return {
      managerId: mgr.id,
      managerName: mgr.name,
      teamSize: subordinates.length,
      totalGoals: teamGoals.length,
      lockedGoals: lockedTeamGoals,
      checkInsCompleted: checkInsForTeam.length,
      totalCheckInsExpected: teamGoals.length,
      approvalRate,
      checkinRate: Math.min(checkinRate, 100),
    };
  }).filter(m => m.teamSize > 0).sort((a, b) => b.approvalRate - a.approvalRate);

  // ── Assemble analytics payload ──
  const analyticsData = {
    qoqTrends,
    departmentCompletion,
    thrustAreaBreakdown,
    uomBreakdown,
    statusBreakdown,
    managerEffectiveness,
    totalEmployees,
    totalGoals,
    overallCompletionRate,
    avgGoalsPerEmployee,
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Analytics & Insights</h1>
          <p className={styles.subtitle}>
            Organization-wide goal achievement trends, distribution analysis, and manager effectiveness metrics.
          </p>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className={styles.kpiStrip}>
        <div className={`${styles.kpiCard} ${styles.kpiAccentBlue}`}>
          <div className={styles.kpiLabel}>
            <Users size={12} /> Total Employees
          </div>
          <div className={styles.kpiValue}>{totalEmployees}</div>
          <div className={styles.kpiContext}>{employeesWithGoals} with active goals</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiAccentGreen}`}>
          <div className={styles.kpiLabel}>
            <Target size={12} /> Total Goals
          </div>
          <div className={styles.kpiValue}>{totalGoals}</div>
          <div className={styles.kpiContext}>{lockedGoals} approved &amp; locked</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiAccentOrange}`}>
          <div className={styles.kpiLabel}>
            <TrendingUp size={12} /> Completion Rate
          </div>
          <div className={styles.kpiValue}>{overallCompletionRate}%</div>
          <div className={styles.kpiContext}>Org-wide goal lock rate</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiAccentPurple}`}>
          <div className={styles.kpiLabel}>
            <BarChart3 size={12} /> Avg Goals / Employee
          </div>
          <div className={styles.kpiValue}>{avgGoalsPerEmployee}</div>
          <div className={styles.kpiContext}>Across all active employees</div>
        </div>
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts data={analyticsData} />
    </div>
  );
}
