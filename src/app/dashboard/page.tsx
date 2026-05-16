import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Target, CheckCircle, Clock, AlertCircle, Users, Settings, Shield } from "lucide-react";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard - AtomQuest",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  if (userRole === "EMPLOYEE") {
    return <EmployeeDashboard userId={userId} />;
  } else if (userRole === "MANAGER") {
    return <ManagerDashboard userId={userId} />;
  } else {
    return <AdminDashboard />;
  }
}

/* ═══════════════════════════════════════════
   EMPLOYEE DASHBOARD
   Shows: My goals summary, weightage status, 
   recent activity on my goals
   ═══════════════════════════════════════════ */
async function EmployeeDashboard({ userId }: { userId: string }) {
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  const goals = activeCycle
    ? await prisma.goal.findMany({
        where: { employeeId: userId, cycleId: activeCycle.id },
        include: { achievements: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const lockedCount = goals.filter((g: any) => g.status === "LOCKED").length;
  const draftCount = goals.filter((g: any) => g.status === "DRAFT").length;
  const submittedCount = goals.filter((g: any) => g.status === "SUBMITTED").length;
  const returnedCount = goals.filter((g: any) => g.status === "RETURNED").length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Dashboard</h1>
          <p className={styles.subtitle}>
            {activeCycle
              ? `${activeCycle.name} — Phase: ${activeCycle.phase}`
              : "No active goal cycle"}
          </p>
        </div>
        <div className={styles.actions}>
          <a href="/dashboard/goals" className="btn btn-primary">
            {goals.length === 0 ? "Create Goals" : "View My Goals"}
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Target size={14} /> TOTAL GOALS</span>
          </div>
          <div className={styles.statValue}>{goals.length}</div>
          <div className={styles.statContext}>of max 8 goals</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><CheckCircle size={14} /> WEIGHTAGE</span>
          </div>
          <div className={styles.statValue}>
            {totalWeightage}%
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={`${styles.progressBarFill} ${totalWeightage === 100 ? styles.progressComplete : ""}`}
              style={{ width: `${Math.min(totalWeightage, 100)}%` }}
            />
          </div>
          <div className={styles.statContext}>{totalWeightage === 100 ? "Complete" : `${100 - totalWeightage}% remaining`}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Clock size={14} /> PENDING</span>
          </div>
          <div className={`${styles.statValue} ${submittedCount > 0 ? styles.textInfo : ""}`}>
            {submittedCount}
          </div>
          <div className={styles.statContext}>Awaiting manager approval</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><AlertCircle size={14} /> STATUS</span>
          </div>
          <div className={styles.statusBreakdown}>
            {draftCount > 0 && <span className={styles.miniTag}>Draft: {draftCount}</span>}
            {submittedCount > 0 && <span className={`${styles.miniTag} ${styles.tagBlue}`}>Submitted: {submittedCount}</span>}
            {lockedCount > 0 && <span className={`${styles.miniTag} ${styles.tagGreen}`}>Locked: {lockedCount}</span>}
            {returnedCount > 0 && <span className={`${styles.miniTag} ${styles.tagRed}`}>Returned: {returnedCount}</span>}
            {goals.length === 0 && <span className={styles.miniTag}>No goals yet</span>}
          </div>
        </div>
      </div>

      {/* Goal List Quick View */}
      {goals.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>My Goal Sheet</h3>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Goal Title</th>
                <th>Thrust Area</th>
                <th>Weightage</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal: any) => (
                <tr key={goal.id}>
                  <td className={styles.goalTitleCell}>{goal.title}</td>
                  <td><span className={styles.thrustTag}>{goal.thrustArea}</span></td>
                  <td><strong>{goal.weightage}%</strong></td>
                  <td>{goal.target ?? "—"}</td>
                  <td>
                    <span className={`${styles.statusDot} ${styles[`status${goal.status}`]}`}>
                      {goal.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {goals.length === 0 && (
        <div className={styles.emptyState}>
          <Target size={40} />
          <h3>No Goals Created Yet</h3>
          <p>Start by defining your goals for the current cycle. You can create up to 8 goals with a combined weightage of 100%.</p>
          <a href="/dashboard/goals" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Create My Goals
          </a>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MANAGER DASHBOARD
   Shows: Team overview, pending approvals, 
   check-in completion status
   ═══════════════════════════════════════════ */
async function ManagerDashboard({ userId }: { userId: string }) {
  const teamMembers = await prisma.user.findMany({
    where: { managerId: userId },
    select: {
      id: true,
      name: true,
      role: true,
      goals: {
        select: { status: true, weightage: true },
      },
    },
  });

  const pendingApprovals = teamMembers.filter(m =>
    m.goals.some((g: any) => g.status === "SUBMITTED")
  ).length;
  const completedSubmissions = teamMembers.filter(m =>
    m.goals.length > 0 && m.goals.every((g: any) => g.status === "LOCKED")
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Team Dashboard</h1>
          <p className={styles.subtitle}>Manage your direct reports, review goals, and conduct check-ins.</p>
        </div>
        <div className={styles.actions}>
          <a href="/dashboard/team" className="btn btn-primary">View Full Team</a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Users size={14} /> DIRECT REPORTS</span>
          </div>
          <div className={styles.statValue}>{teamMembers.length}</div>
          <div className={styles.statContext}>Team members</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><AlertCircle size={14} /> PENDING APPROVALS</span>
          </div>
          <div className={`${styles.statValue} ${pendingApprovals > 0 ? styles.textWarning : ""}`}>
            {pendingApprovals}
          </div>
          <div className={styles.statContext}>Goals awaiting your review</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><CheckCircle size={14} /> APPROVED</span>
          </div>
          <div className={styles.statValue}>{completedSubmissions}</div>
          <div className={styles.statContext}>Goal sheets locked</div>
        </div>
      </div>

      {/* Team Summary Table */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Team Goal Status</h3>
        <table className={styles.simpleTable}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goals Created</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => {
              const hasSubmitted = member.goals.some((g: any) => g.status === "SUBMITTED");
              const isLocked = member.goals.length > 0 && member.goals.every((g: any) => g.status === "LOCKED");
              let status = "Not Started";
              let statusClass = "";
              if (isLocked) { status = "Approved & Locked"; statusClass = styles.tagGreen; }
              else if (hasSubmitted) { status = "Awaiting Approval"; statusClass = styles.tagOrange; }
              else if (member.goals.length > 0) { status = "In Draft"; statusClass = ""; }

              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className={styles.tableAvatar}>{member.name.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{member.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{member.role.toLowerCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td>{member.goals.length}</td>
                  <td><span className={`${styles.miniTag} ${statusClass}`}>{status}</span></td>
                  <td>
                    <a href={`/dashboard/team/${member.id}`} className="btn btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}>
                      Review
                    </a>
                  </td>
                </tr>
              );
            })}
            {teamMembers.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No direct reports assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN DASHBOARD
   Shows: Cycle status, completion rates,
   system-wide metrics
   ═══════════════════════════════════════════ */
async function AdminDashboard() {
  const totalUsers = await prisma.user.count();
  const totalGoals = await prisma.goal.count();
  const activeCycles = await prisma.goalCycle.count({ where: { isActive: true } });
  const submittedGoals = await prisma.goal.count({ where: { status: "SUBMITTED" } });
  const lockedGoals = await prisma.goal.count({ where: { status: "LOCKED" } });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>System-wide overview of goal cycles, completion rates, and governance.</p>
        </div>
        <div className={styles.actions}>
          <a href="/dashboard/admin" className="btn btn-primary">
            <Settings size={16} /> Manage Cycles
          </a>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Users size={14} /> TOTAL USERS</span>
          </div>
          <div className={styles.statValue}>{totalUsers}</div>
          <div className={styles.statContext}>Active accounts</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Target size={14} /> TOTAL GOALS</span>
          </div>
          <div className={styles.statValue}>{totalGoals}</div>
          <div className={styles.statContext}>All cycles</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Shield size={14} /> ACTIVE CYCLES</span>
          </div>
          <div className={styles.statValue}>{activeCycles}</div>
          <div className={styles.statContext}>Ongoing programs</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><CheckCircle size={14} /> COMPLETION</span>
          </div>
          <div className={styles.statValue}>
            {totalGoals > 0 ? Math.round((lockedGoals / totalGoals) * 100) : 0}%
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${totalGoals > 0 ? (lockedGoals / totalGoals) * 100 : 0}%` }}
            />
          </div>
          <div className={styles.statContext}>{lockedGoals} of {totalGoals} goals locked</div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Goal Pipeline</h3>
          <div className={styles.pipelineList}>
            <div className={styles.pipelineItem}>
              <span className={`${styles.pipeDot} ${styles.pipeGray}`}></span>
              <span>Draft</span>
              <strong>{totalGoals - submittedGoals - lockedGoals}</strong>
            </div>
            <div className={styles.pipelineItem}>
              <span className={`${styles.pipeDot} ${styles.pipeBlue}`}></span>
              <span>Submitted</span>
              <strong>{submittedGoals}</strong>
            </div>
            <div className={styles.pipelineItem}>
              <span className={`${styles.pipeDot} ${styles.pipeGreen}`}></span>
              <span>Locked</span>
              <strong>{lockedGoals}</strong>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Quick Actions</h3>
          <div className={styles.quickActions}>
            <a href="/dashboard/admin" className="btn btn-secondary" style={{ width: "100%" }}>
              <Settings size={16} /> Manage Goal Cycles
            </a>
            <a href="/dashboard/team" className="btn btn-secondary" style={{ width: "100%" }}>
              <Users size={16} /> View All Employees
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
