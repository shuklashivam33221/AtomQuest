"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Target, Search, Bell, LogOut } from "lucide-react";
import styles from "./TopNavbar.module.css";

type TopNavbarProps = {
  userName: string;
  userRole: string;
};

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Goals & OKRs", href: "/dashboard/goals" },
  { label: "My Team", href: "/dashboard/team" },
  { label: "Check-ins", href: "/dashboard/checkins" },
];

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

  return (
    <header className={styles.navbar}>
      {/* Left: Logo + Nav Links */}
      <div className={styles.leftSection}>
        <Link href="/dashboard" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Target strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>Atomberg HR</span>
        </Link>

        <nav className={styles.navLinks}>
          {NAV_ITEMS.map((item) => {
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

        <button className={styles.iconButton} aria-label="Notifications">
          <Bell />
          <span className={styles.notifDot} />
        </button>

        <div className={styles.avatarMenu}>
          <button
            className={styles.avatar}
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={`Signed in as ${userName} (${userRole}) — Click to sign out`}
          >
            {getInitials(userName)}
          </button>
        </div>
      </div>
    </header>
  );
}
