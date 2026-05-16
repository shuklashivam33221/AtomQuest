import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Target, CheckCircle, BarChart3, Users, ArrowRight } from "lucide-react";
import styles from "./home.module.css";

export const metadata = {
  title: "AtomQuest — Goal Setting & Tracking Portal",
  description: "A structured, digital Goal Setting & Tracking Portal for Atomberg. Set goals, track achievements, and drive organizational alignment.",
};

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className={styles.page}>
      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logoFlex}>
            <div className={styles.logoIcon}>
              <Target strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>AtomQuest</span>
          </div>
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className={styles.loginBtn}>
            {isLoggedIn ? "Go to Dashboard" : "Sign In"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>Atomberg Internal Portal</span>
          <h1 className={styles.heroTitle}>
            Goal Setting & <br />Tracking Portal
          </h1>
          <p className={styles.heroSub}>
            Align individual objectives to Atomberg's strategic vision. 
            Set goals, track quarterly achievements, and drive accountability 
            across every team.
          </p>
          <div className={styles.heroCta}>
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className={styles.ctaPrimary}>
              {isLoggedIn ? "Go to Dashboard" : "Get Started"} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Target size={24} /></div>
            <h3>Goal Creation</h3>
            <p>Define goals with Thrust Areas, UoM types, targets, and weighted priorities. System enforces 100% weightage and max 8 goals.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><CheckCircle size={24} /></div>
            <h3>Manager Approval</h3>
            <p>L1 managers review, edit inline, and approve goal sheets. Once locked, no further edits without Admin intervention.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><BarChart3 size={24} /></div>
            <h3>Achievement Tracking</h3>
            <p>Quarterly check-ins with Planned vs Actual comparison. Auto-computed progress scores across all UoM types.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Users size={24} /></div>
            <h3>Role-Based Access</h3>
            <p>Three distinct roles — Employee, Manager, and Admin — each with specific dashboards and capabilities.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>AtomQuest · Built for Atomberg Hackathon 1.0</p>
      </footer>
    </div>
  );
}
