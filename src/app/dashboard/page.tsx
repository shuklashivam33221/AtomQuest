import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Target, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard - AtomQuest",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  // Fetch stats based on role
  let stats: Array<{
    title: string;
    value: number;
    icon: any;
    context: string;
  }> = [];

  if (userRole === "EMPLOYEE") {
    const goals = await prisma.goal.findMany({ where: { employeeId: userId } });
    
    stats = [
      {
        title: "Total Goals",
        value: goals.length,
        icon: Target,
        context: "Current FY",
      },
      {
        title: "Locked",
        value: goals.filter((g: any) => g.status === "LOCKED").length,
        icon: CheckCircle,
        context: "Approved & Active",
      },
      {
        title: "Pending Approval",
        value: goals.filter((g: any) => g.status === "SUBMITTED").length,
        icon: Clock,
        context: "Awaiting Manager",
      },
      {
        title: "Drafts",
        value: goals.filter((g: any) => g.status === "DRAFT").length,
        icon: AlertCircle,
        context: "Needs submission",
      },
    ];
  } else if (userRole === "MANAGER") {
    const team = await prisma.user.findMany({ where: { managerId: userId } });
    const teamIds = team.map((u: any) => u.id);
    const teamGoals = await prisma.goal.findMany({
      where: { employeeId: { in: teamIds } },
    });

    stats = [
      {
        title: "Team Members",
        value: team.length,
        icon: Users,
        context: "Direct reports",
      },
      {
        title: "Team Goals",
        value: teamGoals.length,
        icon: Target,
        context: "Total across team",
      },
      {
        title: "Pending Approvals",
        value: teamGoals.filter((g: any) => g.status === "SUBMITTED").length,
        icon: Clock,
        context: "Requires action",
      },
    ];
  } else if (userRole === "ADMIN") {
    const totalUsers = await prisma.user.count();
    const totalGoals = await prisma.goal.count();
    const activeCycles = await prisma.goalCycle.count({ where: { isActive: true } });

    stats = [
      {
        title: "Total Users",
        value: totalUsers,
        icon: Users,
        context: "Active accounts",
      },
      {
        title: "Platform Goals",
        value: totalGoals,
        icon: Target,
        context: "All cycles",
      },
      {
        title: "Active Cycles",
        value: activeCycles,
        icon: Clock,
        context: "Ongoing programs",
      },
    ];
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Welcome back to AtomQuest. Here's a summary of your goal tracking.
        </p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>{stat.title}</span>
              <div className={styles.statIcon}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statContext}>{stat.context}</div>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className={styles.emptyState}>
          <Target className={styles.emptyIcon} />
          <h3>No data available</h3>
          <p>Get started by creating your first goal.</p>
        </div>
      )}
    </div>
  );
}
