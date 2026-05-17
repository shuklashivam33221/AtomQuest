import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import styles from "../page.module.css";
import checkinStyles from "./Checkins.module.css";
import CheckinClient from "./CheckinClient";

export const metadata = {
  title: "Check-ins - Atomberg HR",
};

export default async function CheckinsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  if (userRole === "EMPLOYEE") redirect("/dashboard");

  // Fetch the active cycle to only show current goals
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true }
  });

  // Fetch direct reports WITH their goals and achievements for the active cycle
  const teamMembers = await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: { 
      id: true, 
      name: true, 
      role: true,
      goals: activeCycle ? {
        where: { cycleId: activeCycle.id, status: "LOCKED" },
        include: { achievements: true }
      } : { where: { id: "none" } }
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any; // Type cast to any for simplify, since TeamMember expects Goal[] with achievements array

  if (teamMembers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Check-ins</h1>
        </div>
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <p>You have no direct reports to check in with.</p>
          </div>
        </div>
      </div>
    );
  }

  const allCheckins = await prisma.checkIn.findMany({
    where: { managerId: session.user.id },
    include: { goal: { select: { employeeId: true } } },
    orderBy: { checkinDate: "desc" },
  });

  return (
    <div className={styles.container}>
      {/* Remove standard header, since the checkins layout is unique */}
      <div className={checkinStyles.layout}>
        <CheckinClient teamMembers={teamMembers} initialCheckins={allCheckins} />
      </div>
    </div>
  );
}
