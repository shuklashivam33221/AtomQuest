"use client";

import { Calendar } from "lucide-react";
import styles from "./TopBar.module.css";

type TopBarProps = {
  userName: string;
  userRole: string;
  pageTitle?: string;
  cycleName?: string;
  cyclePhase?: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ROLE_STYLES: Record<string, string> = {
  EMPLOYEE: styles.roleEmployee,
  MANAGER: styles.roleManager,
  ADMIN: styles.roleAdmin,
};

export default function TopBar({
  userName,
  userRole,
  pageTitle = "Dashboard",
  cycleName = "FY 2025-26",
  cyclePhase = "Goal Setting",
}: TopBarProps) {
  const firstName = userName.split(" ")[0];

  return (
    <header className={styles.topbar}>
      <div className={styles.greeting}>
        <span className={styles.greetingText}>
          {getGreeting()}, {firstName}
        </span>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.actions}>
        <div className={styles.cycleInfo}>
          <Calendar />
          {cycleName}
          <span className={styles.phaseBadge}>{cyclePhase}</span>
        </div>
        <span className={`${styles.roleBadge} ${ROLE_STYLES[userRole] || ""}`}>
          {userRole}
        </span>
      </div>
    </header>
  );
}
