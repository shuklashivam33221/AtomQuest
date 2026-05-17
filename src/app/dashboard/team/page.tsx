import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle, AlertCircle, Calendar, Mail, UserSearch } from "lucide-react";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import TeamActionsClient from "./TeamActionsClient";
import styles from "../page.module.css";
import teamStyles from "./Team.module.css";
import TeamListClient from "./TeamListClient";

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
          <TeamActionsClient 
            teamMembers={teamMembers} 
            managerName={session.user.name || "Manager"} 
            managerEmail={session.user.email || ""} 
          />
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
      <TeamListClient teamMembers={teamMembers} />
    </div>
  );
}
