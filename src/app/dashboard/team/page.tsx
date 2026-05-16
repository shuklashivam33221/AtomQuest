import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle, AlertCircle, Calendar, Mail, UserSearch } from "lucide-react";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import styles from "../page.module.css";
import teamStyles from "./Team.module.css";

export const metadata = {
  title: "My Team - Atomberg HR",
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") {
    redirect("/dashboard");
  }

  // Fetch direct reports
  const teamMembers = await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      goals: {
        where: { status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } },
        select: { status: true, weightage: true },
      },
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Organization</h1>
          <p className={styles.cycleInfo}>Manage direct reports, reviews, and continuous feedback.</p>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-secondary">Org Chart</button>
          <button className="btn btn-primary">Request Feedback</button>
        </div>
      </div>
      
      {/* Team Summary Cards */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>DIRECT REPORTS</span>
            <Users size={14} className={styles.headingIcon} />
          </div>
          <div className={styles.statValue}>{teamMembers.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>GOAL SUBMISSIONS</span>
            <CheckCircle size={14} style={{ color: "var(--success)" }} />
          </div>
          <div className={styles.statValue}>
            {teamMembers.filter(m => m.goals.length > 0).length}
            <span className={styles.statSubValue}>/{teamMembers.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>OVERDUE APPROVALS</span>
            <AlertCircle size={14} style={{ color: "var(--danger)" }} />
          </div>
          <div className={`${styles.statValue} ${styles.textWarning}`}>
            {teamMembers.filter(m => m.goals.some(g => g.status === "SUBMITTED")).length}
          </div>
        </div>
      </div>

      {/* Team List Table */}
      <div className={teamStyles.teamTableWrapper}>
        <div className={teamStyles.tableHeader}>
          <div className={teamStyles.searchBar}>
            <UserSearch size={16} className={teamStyles.searchIcon} />
            <input type="text" placeholder="Search team..." className={teamStyles.searchInput} />
          </div>
          <button className="btn btn-secondary"><Users size={14}/> Filter</button>
        </div>
        <table className={teamStyles.table}>
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>GOAL STATUS</th>
              <th>LAST 1:1</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className={teamStyles.emptyCell}>No direct reports found.</td>
              </tr>
            ) : (
              teamMembers.map(member => {
                const hasSubmitted = member.goals.some(g => g.status === "SUBMITTED");
                const isLocked = member.goals.length > 0 && member.goals.every(g => g.status === "LOCKED");
                
                let goalStatus = "NOT_STARTED";
                if (hasSubmitted) goalStatus = "SUBMITTED";
                else if (isLocked) goalStatus = "LOCKED";
                else if (member.goals.length > 0) goalStatus = "DRAFT";

                return (
                  <tr key={member.id}>
                    <td>
                      <div className={teamStyles.employeeCell}>
                        <div className={teamStyles.avatar}>
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/dashboard/team/${member.id}`} className={teamStyles.employeeName}>
                            {member.name}
                          </Link>
                          <div className={teamStyles.employeeRole}>{member.role.toLowerCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {hasSubmitted ? (
                        <div className={teamStyles.actionRequired}>Action Required</div>
                      ) : (
                        <StatusBadge status={goalStatus} size="sm" />
                      )}
                    </td>
                    <td className={teamStyles.mutedText}>2 days ago</td>
                    <td>
                      <div className={teamStyles.rowActions}>
                        <Link href={`/dashboard/team/${member.id}`} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                          Review Goals
                        </Link>
                        <button className={teamStyles.iconBtn} title="Email"><Mail size={16} /></button>
                        <button className={teamStyles.iconBtn} title="Schedule 1:1"><Calendar size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
