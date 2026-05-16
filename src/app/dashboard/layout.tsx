import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar/Sidebar";
import TopBar from "@/components/TopBar/TopBar";
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

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar
        userName={session.user.name || "User"}
        userRole={(session.user as any).role || "EMPLOYEE"}
      />
      <div className={styles.mainContent}>
        <TopBar
          userName={session.user.name || "User"}
          userRole={(session.user as any).role || "EMPLOYEE"}
        />
        <main className={styles.pageContainer}>{children}</main>
      </div>
    </div>
  );
}
