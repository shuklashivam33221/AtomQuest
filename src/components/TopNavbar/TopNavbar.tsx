"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Target, Search, Bell } from "lucide-react";
import styles from "./TopNavbar.module.css";

type TopNavbarProps = {
  userName: string;
  userRole: string;
};

// Role-specific navigation
const NAV_BY_ROLE: Record<string, Array<{ label: string; href: string }>> = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Goals", href: "/dashboard/goals" },
  ],
  MANAGER: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Goals", href: "/dashboard/goals" },
    { label: "My Team", href: "/dashboard/team" },
    { label: "Check-ins", href: "/dashboard/checkins" },
    { label: "Analytics", href: "/dashboard/analytics" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Goals & OKRs", href: "/dashboard/goals" },
    { label: "My Team", href: "/dashboard/team" },
    { label: "Check-ins", href: "/dashboard/checkins" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Admin", href: "/dashboard/admin" },
  ],
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TopNavbar({ userName, userRole }: TopNavbarProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[userRole] || NAV_BY_ROLE.EMPLOYEE;

  return (
    <header className={styles.navbar}>
      {/* Left: Logo + Nav Links */}
      <div className={styles.leftSection}>
        <Link href="/dashboard" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Target strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>AtomQuest</span>
        </Link>

        <nav className={styles.navLinks}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Notifications, Avatar */}
      <div className={styles.rightSection}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search goals, people..."
            className={styles.searchInput}
          />
        </div>

        <button 
          className={styles.iconButton} 
          aria-label="Notifications"
          onClick={() => alert("All caught up! No new notifications.")}
        >
          <Bell />
          <span className={styles.notifDot} />
        </button>

        <div className={styles.avatarMenu}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {getInitials(userName)}
            </div>
            <div className={styles.dropdown}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userRole}>{userRole}</span>
              </div>
              <button
                className={styles.logoutBtn}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
