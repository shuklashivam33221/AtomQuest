import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GoalForm from "@/components/GoalForm/GoalForm";
import AchievementTracker from "@/components/AchievementTracker/AchievementTracker";
import { Lock } from "lucide-react";
import styles from "../page.module.css";

export const metadata = {
  title: "Goals & OKRs - Atomberg HR",
};

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role;

  // Active Cycle
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Goals & OKRs</h1>
        </div>
        <div className={styles.emptyState}>
          <h3>No Active Cycle</h3>
          <p>Please contact HR to initiate a goal setting cycle.</p>
        </div>
      </div>
    );
  }

  // Fetch goals WITH achievements
  const existingGoals = await prisma.goal.findMany({
    where: {
      employeeId: userId,
      cycleId: activeCycle.id,
    },
    include: {
      achievements: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const isLocked = existingGoals.length > 0 && existingGoals.every(g => g.status === "LOCKED");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Goal Sheet</h1>
          <p className={styles.cycleInfo}>
            {activeCycle.name} — Phase: <span className={styles.cycleStrong}>{activeCycle.phase}</span>
          </p>
        </div>
        {isLocked && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 600, backgroundColor: "var(--success-bg)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)" }}>
            <Lock size={16} /> Goals Locked & Approved
          </div>
        )}
      </div>
      
      {userRole === "EMPLOYEE" ? (
        isLocked ? (
          <AchievementTracker goals={existingGoals} />
        ) : (
          <GoalForm cycleId={activeCycle.id} existingGoals={existingGoals} />
        )
      ) : (
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <p>Managers and Admins use the &quot;My Team&quot; and &quot;Admin Panel&quot; tabs to manage goals.</p>
          </div>
        </div>
      )}
    </div>
  );
}
