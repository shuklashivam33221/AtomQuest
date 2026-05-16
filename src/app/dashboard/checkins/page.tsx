import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Video, Plus, MessageSquare } from "lucide-react";
import styles from "../page.module.css";
import checkinStyles from "./Checkins.module.css";
import CheckinClient from "./CheckinClient";

export const metadata = {
  title: "Check-ins - Atomberg HR",
};

export default async function CheckinsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") redirect("/dashboard");

  // Fetch direct reports
  const teamMembers = await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: { id: true, name: true, role: true },
  });

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

  // Pre-fetch checkins for the first team member to load the initial view
  // In a real app, we'd use URL params to select the active member. 
  // For the hackathon, we'll build it as a client component that fetches or receives data.
  const allCheckins = await prisma.checkIn.findMany({
    where: { managerId: session.user.id },
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
