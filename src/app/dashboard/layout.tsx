import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopNavbar from "@/components/TopNavbar/TopNavbar";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role || "EMPLOYEE";

  const notifications: Array<{ id: string; type: string; title: string; message: string; date: string }> = [];

  if (userId) {
    // 1. Fetch returned goals feedback
    const returnedGoals = await prisma.goal.findMany({
      where: { employeeId: userId, status: "RETURNED" },
      orderBy: { updatedAt: "desc" },
    });
    for (const goal of returnedGoals) {
      notifications.push({
        id: `returned-${goal.id}`,
        type: "rework",
        title: "Goal Returned for Rework",
        message: `Your manager returned the goal "${goal.title}" for revision.`,
        date: goal.updatedAt.toLocaleDateString(),
      });
    }

    // 2. Fetch manager check-in comments
    const checkins = await prisma.checkIn.findMany({
      where: { goal: { employeeId: userId } },
      include: { goal: true, manager: true },
      orderBy: { checkinDate: "desc" },
    });
    for (const c of checkins) {
      notifications.push({
        id: `checkin-${c.id}`,
        type: "feedback",
        title: `Feedback on ${c.quarter}`,
        message: `${c.manager.name} added comment: "${c.managerComment}"`,
        date: c.checkinDate.toLocaleDateString(),
      });
    }

    // 3. Fetch shared goals pushed
    const sharedGoals = await prisma.goal.findMany({
      where: { employeeId: userId, isShared: true },
      orderBy: { createdAt: "desc" },
    });
    for (const goal of sharedGoals) {
      notifications.push({
        id: `shared-${goal.id}`,
        type: "shared",
        title: "Department KPI Pushed",
        message: `New shared goal: "${goal.title}"`,
        date: goal.createdAt.toLocaleDateString(),
      });
    }

    // 4. Fetch approved/locked goals
    const approvedGoals = await prisma.goal.findMany({
      where: { employeeId: userId, status: "LOCKED" },
      orderBy: { updatedAt: "desc" },
    });
    for (const goal of approvedGoals) {
      notifications.push({
        id: `locked-${goal.id}`,
        type: "approval",
        title: "Goals Approved & Locked",
        message: `Your goal "${goal.title}" has been approved and locked.`,
        date: goal.updatedAt.toLocaleDateString(),
      });
    }

    // 5. If manager, fetch submitted goal sheets awaiting review
    if (userRole === "MANAGER" || userRole === "ADMIN") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true, name: true },
      });
      const subIds = subordinates.map(s => s.id);
      if (subIds.length > 0) {
        const submittedGoals = await prisma.goal.findMany({
          where: { employeeId: { in: subIds }, status: "SUBMITTED" },
          include: { employee: true },
          orderBy: { updatedAt: "desc" },
        });
        const uniqueEmployeeSubmissions = Array.from(new Set(submittedGoals.map(g => g.employeeId)));
        for (const empId of uniqueEmployeeSubmissions) {
          const empGoals = submittedGoals.filter(g => g.employeeId === empId);
          const empName = empGoals[0].employee.name;
          notifications.push({
            id: `submit-${empId}`,
            type: "submission",
            title: "Goal Sheet Submitted",
            message: `${empName} has submitted their goal sheet for your review.`,
            date: empGoals[0].updatedAt.toLocaleDateString(),
          });
        }
      }
    }
  }

  // Sort notifications by date descending
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbar
        userName={session.user.name || "User"}
        userRole={userRole}
        notifications={notifications}
      />
      <main className={styles.pageContainer}>{children}</main>
    </div>
  );
}
