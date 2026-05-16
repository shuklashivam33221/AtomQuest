import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbar
        userName={session.user.name || "User"}
        userRole={(session.user as { role?: string }).role || "EMPLOYEE"}
      />
      <main className={styles.pageContainer}>{children}</main>
    </div>
  );
}
