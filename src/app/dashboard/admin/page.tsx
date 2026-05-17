import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings, Shield, Activity, Share2 } from "lucide-react";
import styles from "../page.module.css";
import UnlockGoalForm from "./UnlockGoalForm";
import CycleManagerClient from "./CycleManagerClient";
import SharedGoalForm from "./SharedGoalForm";
import OrgHierarchyManager from "./OrgHierarchyManager";
import BroadcastRemindersForm from "./BroadcastRemindersForm";
import { Users } from "lucide-react";

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

  // Fetch all users to map hierarchy & changer names
  const allUsers = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const userMap = new Map(allUsers.map(u => [u.id, u.name]));

  const employeesForHierarchy = allUsers
    .filter((u) => u.role === "EMPLOYEE")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      managerId: u.managerId,
    }));

  const managersForHierarchy = allUsers
    .filter((u) => u.role === "MANAGER")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      managerId: u.managerId,
    }));

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

  // Real-time Quarterly Check-in Completion Dashboard
  let completionList: Array<{
    employeeName: string;
    managerName: string;
    phase: string;
    checkedInCount: number;
    totalCount: number;
    status: "Completed" | "In Progress" | "Pending";
  }> = [];

  if (activeCycle) {
    const activeGoals = await prisma.goal.findMany({
      where: { cycleId: activeCycle.id },
      include: {
        employee: {
          select: {
            name: true,
            manager: { select: { name: true } }
          }
        },
        checkIns: {
          where: { quarter: activeCycle.phase }
        }
      }
    });

    // Group by employee
    const employeeGoalGroups = new Map<string, typeof activeGoals>();
    for (const goal of activeGoals) {
      const empId = goal.employeeId;
      if (!employeeGoalGroups.has(empId)) {
        employeeGoalGroups.set(empId, []);
      }
      employeeGoalGroups.get(empId)!.push(goal);
    }

    for (const [empId, empGoals] of employeeGoalGroups.entries()) {
      const firstGoal = empGoals[0];
      const employeeName = firstGoal.employee.name;
      const managerName = firstGoal.employee.manager?.name || "No Manager";
      
      const totalCount = empGoals.length;
      const checkedInCount = empGoals.filter(g => g.checkIns.length > 0).length;

      let status: "Completed" | "In Progress" | "Pending" = "Pending";
      if (checkedInCount === totalCount) {
        status = "Completed";
      } else if (checkedInCount > 0) {
        status = "In Progress";
      }

      completionList.push({
        employeeName,
        managerName,
        phase: activeCycle.phase,
        checkedInCount,
        totalCount,
        status
      });
    }
  }

  // Real-time Governance Audit Trail
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { changedAt: "desc" },
    include: {
      goal: {
        select: {
          title: true,
          employee: { select: { name: true, email: true } },
        },
      },
    },
    take: 10,
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.cycleInfo}>Manage cycles, shared goals, hierarchy, and system audits.</p>
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
 
      {/* Real-time Check-in Completion Dashboard */}
      <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.sectionHeading}>
          <Activity size={16} className={styles.headingIcon} /> Real-Time Check-In Completion Tracker
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
          Track which employees have completed their check-ins with their L1 managers for the active cycle phase (<strong>{activeCycle?.phase || "None"}</strong>).
        </p>
        
        <div className={styles.tableWrapper} style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>L1 MANAGER</th>
                <th>CYCLE PHASE</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {completionList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No check-in progress records found for this cycle.
                  </td>
                </tr>
              ) : (
                completionList.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 500 }}>{item.employeeName}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{item.managerName}</td>
                    <td>
                      <span className={styles.thrustTag} style={{ textTransform: "uppercase", backgroundColor: "rgba(0, 112, 243, 0.08)", color: "var(--primary)", fontSize: "0.75rem" }}>
                        {item.phase}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.checkedInCount} / {item.totalCount} Goals</td>
                    <td>
                      <span className={styles.thrustTag} style={{
                        backgroundColor: item.status === "Completed" ? "rgba(16, 185, 129, 0.08)" : item.status === "In Progress" ? "rgba(245, 158, 11, 0.08)" : "rgba(107, 114, 128, 0.08)",
                        color: item.status === "Completed" ? "var(--success)" : item.status === "In Progress" ? "var(--warning)" : "var(--text-muted)",
                        textTransform: "capitalize"
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Org Hierarchy Control Panel */}
      <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.sectionHeading}>
          <Users size={16} className={styles.headingIcon} /> Organization Hierarchy Management
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
          Ensure all employees are correctly mapped to their reporting manager. You can trigger an automated lookup via Microsoft Entra ID (Azure AD) or override mappings manually.
        </p>
        <OrgHierarchyManager employees={employeesForHierarchy} managers={managersForHierarchy} />
      </div>

      <div className={styles.bottomGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
        
        {/* Cycle Management */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Settings size={16} className={styles.headingIcon} /> Goal Cycles
          </div>
          <CycleManagerClient cycles={cycles} />
        </div>

        {/* Export & Reporting */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Activity size={16} className={styles.headingIcon} /> Export & Reporting
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem", marginTop: "1rem" }}>
            Download a comprehensive CSV report containing all goals, targets, quarterly achievements, and auto-computed progress scores.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <a href="/api/admin/export" download className="btn btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
              Download CSV Report
            </a>
            {activeCycle && (
              <BroadcastRemindersForm cycleId={activeCycle.id} />
            )}
          </div>

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

      {/* Real-time Governance Audit Trail */}
      <div className={styles.card} style={{ marginTop: "1.5rem" }}>
        <div className={styles.sectionHeading}>
          <Activity size={16} className={styles.headingIcon} /> Real-Time Governance Audit Trail
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
          Examine the latest system mutations made to employee goals post manager locking.
        </p>

        <div className={styles.tableWrapper} style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>GOAL TITLE & EMPLOYEE</th>
                <th>FIELD MUTATED</th>
                <th>OLD VALUE</th>
                <th>NEW VALUE</th>
                <th>OPERATOR</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const changerName = userMap.get(log.changedBy) || log.changedBy;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                        {new Date(log.changedAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.goal.title}>
                          {log.goal.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Emp: {log.goal.employee.name}
                        </div>
                      </td>
                      <td>
                        <span className={styles.thrustTag} style={{ textTransform: "uppercase", backgroundColor: "rgba(0,0,0,0.04)" }}>
                          {log.field}
                        </span>
                      </td>
                      <td style={{ color: "var(--danger)", textDecoration: "line-through", fontSize: "0.8125rem" }}>
                        {log.oldValue || "N/A"}
                      </td>
                      <td style={{ color: "var(--success)", fontWeight: 500, fontSize: "0.8125rem" }}>
                        {log.newValue || "N/A"}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{changerName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
