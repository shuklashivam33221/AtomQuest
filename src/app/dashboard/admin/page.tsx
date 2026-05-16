import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings, Shield, Activity, Share2 } from "lucide-react";
import styles from "../page.module.css";

export const metadata = {
  title: "Admin Panel - Atomberg HR",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const cycles = await prisma.goalCycle.findMany({
    orderBy: { startDate: "desc" },
  });

  const totalUsers = await prisma.user.count();
  const activeCycle = cycles.find(c => c.isActive);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.cycleInfo}>Manage cycles, shared goals, and system audits.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>SYSTEM USERS</span>
            <Shield size={14} style={{ color: "var(--primary)" }} />
          </div>
          <div className={styles.statValue}>{totalUsers}</div>
          <div className={styles.statContext}>Active Accounts</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>ACTIVE CYCLE</span>
            <Settings size={14} style={{ color: "var(--info)" }} />
          </div>
          <div className={styles.statValue} style={{ fontSize: "1.5rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {activeCycle ? activeCycle.name : "None"}
          </div>
          <div className={styles.statContext}>Phase: {activeCycle?.phase || "N/A"}</div>
        </div>
      </div>

      <div className={styles.bottomGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
        
        {/* Cycle Management */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Settings size={16} className={styles.headingIcon} /> Goal Cycles
          </div>
          <div className={styles.tableWrapper} style={{ marginTop: "1rem" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CYCLE NAME</th>
                  <th>PHASE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map(cycle => (
                  <tr key={cycle.id}>
                    <td style={{ fontWeight: 500 }}>{cycle.name}</td>
                    <td>{cycle.phase}</td>
                    <td>
                      {cycle.isActive ? (
                        <span className={styles.badgeSuccess}>Active</span>
                      ) : (
                        <span className={styles.badgeSoftSuccess} style={{ backgroundColor: "var(--background)", color: "var(--text-secondary)" }}>Inactive</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button className="btn btn-primary">+ Create New Cycle</button>
          </div>
        </div>

        {/* Audit Log (Placeholder) */}
        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <Activity size={16} className={styles.headingIcon} /> Recent Audit Logs
          </div>
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", backgroundColor: "var(--background)", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
            No recent high-privilege actions recorded.
          </div>

          <div className={styles.sectionHeading} style={{ marginTop: "2rem" }}>
            <Share2 size={16} className={styles.headingIcon} /> Department Shared Goals
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Push a top-level KPI directly into the goal sheets of an entire department.
          </p>
          <button className="btn btn-secondary">Create Shared Goal</button>
        </div>

      </div>
    </div>
  );
}
