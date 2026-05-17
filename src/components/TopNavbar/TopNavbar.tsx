"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Target, Search, Bell } from "lucide-react";
import styles from "./TopNavbar.module.css";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
};

type TopNavbarProps = {
  userName: string;
  userRole: string;
  notifications?: NotificationItem[];
};

// Role-specific navigation
const NAV_BY_ROLE: Record<string, Array<{ label: string; href: string }>> = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Goals", href: "/dashboard/goals" },
    { label: "Company OKRs", href: "/dashboard/company-okrs" },
  ],
  MANAGER: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Goals", href: "/dashboard/goals" },
    { label: "My Team", href: "/dashboard/team" },
    { label: "Check-ins", href: "/dashboard/checkins" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Company OKRs", href: "/dashboard/company-okrs" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Goals & OKRs", href: "/dashboard/goals" },
    { label: "My Team", href: "/dashboard/team" },
    { label: "Check-ins", href: "/dashboard/checkins" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Company OKRs", href: "/dashboard/company-okrs" },
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

export default function TopNavbar({ userName, userRole, notifications = [] }: TopNavbarProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[userRole] || NAV_BY_ROLE.EMPLOYEE;
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.length;

  return (
    <header className={styles.navbar}>
      {/* Left: Logo + Nav Links */}
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logo}>
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

        <div style={{ position: "relative" }}>
          <button 
            className={styles.iconButton} 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell />
            {unreadCount > 0 && <span className={styles.notifDot} />}
          </button>

          {showNotifications && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Notifications</span>
                {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount} New</span>}
              </div>
              <div className={styles.notifList}>
                {unreadCount === 0 ? (
                  <div className={styles.notifEmpty}>
                    🎈 All caught up! No new notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={styles.notifItem}>
                      <div className={styles.notifItemHeader}>
                        <span className={styles.notifIcon}>
                          {notif.type === "rework" && "⚠️"}
                          {notif.type === "feedback" && "💬"}
                          {notif.type === "shared" && "📌"}
                          {notif.type === "approval" && "✅"}
                          {notif.type === "submission" && "📥"}
                        </span>
                        <strong className={styles.notifTitle}>{notif.title}</strong>
                        <span className={styles.notifDate}>{notif.date}</span>
                      </div>
                      <p className={styles.notifMessage}>{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
