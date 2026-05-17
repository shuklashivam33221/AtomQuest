"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Target,
  LayoutDashboard,
  ListChecks,
  Users,
  Settings,
  BarChart3,
  ClipboardCheck,
  LogOut,
  Shield,
} from "lucide-react";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  userName: string;
  userRole: string;
};

const NAV_ITEMS = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Goals", href: "/dashboard/goals", icon: ListChecks },
    { label: "Achievements", href: "/dashboard/achievements", icon: BarChart3 },
  ],
  MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Goals", href: "/dashboard/goals", icon: ListChecks },
    { label: "Team Goals", href: "/dashboard/team", icon: Users },
    { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
    { label: "Check-ins", href: "/dashboard/checkins", icon: BarChart3 },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "All Goals", href: "/dashboard/goals", icon: ListChecks },
    { label: "Team Overview", href: "/dashboard/team", icon: Users },
    { label: "Goal Cycles", href: "/dashboard/cycles", icon: Settings },
    { label: "Admin Panel", href: "/dashboard/admin", icon: Shield },
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

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const role = userRole as keyof typeof NAV_ITEMS;
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.EMPLOYEE;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <Link href="/" className={styles.logoFlex} style={{ textDecoration: 'none' }}>
          <div className={styles.logoIcon}>
            <Target strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>AtomQuest</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Menu</div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${
                  isActive ? styles.navLinkActive : ""
                }`}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className={styles.userArea}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{getInitials(userName)}</div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userRole}>{userRole.toLowerCase()}</div>
          </div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
