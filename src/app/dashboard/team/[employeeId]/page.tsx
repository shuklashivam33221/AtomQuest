import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Target } from "lucide-react";
import styles from "../../page.module.css";
import ManagerApprovalClient from "./ManagerApprovalClient";

export const metadata = {
  title: "Review Goals - Atomberg HR",
};

export default async function EmployeeGoalReviewPage({
  params,
}: {
  params: { employeeId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") redirect("/dashboard");

  const employee = await prisma.user.findUnique({
    where: { id: params.employeeId },
    include: {
      goals: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!employee) {
    return <div className={styles.container}>Employee not found.</div>;
  }

  // Ensure this manager actually manages this employee (or is an Admin)
  if (userRole !== "ADMIN" && employee.managerId !== session.user.id) {
    return <div className={styles.container}>Unauthorized. You do not manage this employee.</div>;
  }

  // Active Cycle
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  const cycleGoals = employee.goals.filter(g => g.cycleId === activeCycle?.id);
  const isSubmitted = cycleGoals.length > 0 && cycleGoals.every(g => g.status === "SUBMITTED" || g.status === "APPROVED" || g.status === "LOCKED");
  const isLocked = cycleGoals.length > 0 && cycleGoals.every(g => g.status === "LOCKED");

  return (
    <div className={styles.container}>
      <Link href="/dashboard/team" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "-1rem" }}>
        <ArrowLeft size={16} /> Back to My Team
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{employee.name}&apos;s Goal Sheet</h1>
          <p className={styles.cycleInfo}>
            <User size={14} /> {employee.role.toLowerCase()} · <Target size={14} style={{marginLeft: "0.5rem"}}/> {activeCycle?.name}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <ManagerApprovalClient 
          employeeId={employee.id} 
          cycleId={activeCycle?.id || ""} 
          goals={cycleGoals} 
          isSubmitted={isSubmitted}
          isLocked={isLocked}
        />
      </div>
    </div>
  );
}
