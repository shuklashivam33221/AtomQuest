import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings, Shield, Activity, Share2 } from "lucide-react";
import styles from "../page.module.css";
import UnlockGoalForm from "./UnlockGoalForm";
import CycleManagerClient from "./CycleManagerClient";
import SharedGoalForm from "./SharedGoalForm";

export const metadata = {
  title: "Admin Panel - Atomberg HR",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const cycles = await prisma.goalCycle.findMany({
    orderBy: { startDate: "desc" },
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" }
  });

  const totalUsers = await prisma.user.count({ where: { role: "EMPLOYEE" } });
  const activeCycle = cycles.find(c => c.isActive);

  // Completion Dashboard Stats
  let totalGoals = 0;
  let lockedGoals = 0;
  let submittedGoals = 0;

  if (activeCycle) {
    const cycleGoals = await prisma.goal.findMany({
      where: { cycleId: activeCycle.id }
    });
    totalGoals = cycleGoals.length;
    lockedGoals = cycleGoals.filter(g => g.status === "LOCKED").length;
    submittedGoals = cycleGoals.filter(g => g.status === "SUBMITTED").length;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.cycleInfo}>Manage cycles, shared goals, and system audits.</p>
        </div>
      </div>

      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>SYSTEM USERS</span>
            <Shield size={14} style={{ color: "var(--primary)" }} />
          </div>
          <div className={styles.statValue}>{totalUsers}</div>
          <div className={styles.statContext}>Active Employees</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>ACTIVE CYCLE</span>
            <Settings size={14} style={{ color: "var(--info)" }} />
          </div>
          <div className={styles.statValue} style={{ fontSize: "1.25rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {activeCycle ? activeCycle.name : "None"}
          </div>
          <div className={styles.statContext}>Phase: {activeCycle?.phase || "N/A"}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>GOAL SUBMISSIONS</span>
            <Activity size={14} style={{ color: "var(--warning)" }} />
          </div>
          <div className={styles.statValue}>{totalGoals > 0 ? Math.round(((submittedGoals + lockedGoals) / totalGoals) * 100) : 0}%</div>
          <div className={styles.statContext}>{submittedGoals + lockedGoals} of {totalGoals} Goals</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>MANAGER APPROVALS</span>
            <Activity size={14} style={{ color: "var(--success)" }} />
          </div>
          <div className={styles.statValue}>{totalGoals > 0 ? Math.round((lockedGoals / totalGoals) * 100) : 0}%</div>
          <div className={styles.statContext}>{lockedGoals} goals locked</div>
        </div>
      </div>

      <div className={styles.bottomGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
        
        {/* Cycle Management */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Settings size={16} className={styles.headingIcon} /> Goal Cycles
          </div>
          <CycleManagerClient cycles={cycles} />
        </div>

        {/* Audit Log (Placeholder) */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Activity size={16} className={styles.headingIcon} /> Export & Reporting
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem", marginTop: "1rem" }}>
            Download a comprehensive CSV report containing all goals, targets, quarterly achievements, and auto-computed progress scores.
          </p>
          <a href="/api/admin/export" download className="btn btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Download CSV Report
          </a>

          <div className={styles.sectionHeading} style={{ marginTop: "2rem" }}>
            <Share2 size={16} className={styles.headingIcon} /> Department Shared Goals
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Push a top-level KPI directly into the goal sheets of an entire department.
          </p>

          {activeCycle ? (
            <SharedGoalForm cycleId={activeCycle.id} departments={departments} />
          ) : (
            <div style={{ fontSize: "0.875rem", color: "var(--warning)" }}>No active cycle available to push goals into.</div>
          )}

          {activeCycle && (
            <UnlockGoalForm cycleId={activeCycle.id} />
          )}
        </div>

      </div>
    </div>
  );
}
