import Link from "next/link";
import { Shield, ArrowLeft, Lock, Users, Activity } from "lucide-react";
import styles from "./privacy.module.css";

export const metadata = {
  title: "Privacy Policy - AtomQuest",
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logoFlex}>
          <Shield size={20} className={styles.logoIcon} />
          <span className={styles.logoText}>AtomQuest Governance</span>
        </Link>
        <Link href="/" className={styles.backHomeBtn}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.tag}>Atomberg Corporate Standards</div>
          <h1 className={styles.title}>Privacy &amp; Data Governance Policy</h1>
          <p className={styles.subtitle}>
            Last updated: May 17, 2026. This policy outlines how AtomQuest processes, secures, and audits performance data.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Card 1: Auth & SSO */}
          <div className={styles.card}>
            <Lock size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Identity &amp; SSO Integration</h2>
            <p className={styles.cardText}>
              We utilize Microsoft Entra ID (formerly Azure AD) for Single Sign-On (SSO). Authentication tokens, profile attributes, and organizational security groups are derived securely from your corporate directory. No personal passwords are saved or stored in plaintext.
            </p>
          </div>

          {/* Card 2: Performance Auditing */}
          <div className={styles.card}>
            <Activity size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>System Audit Trails</h2>
            <p className={styles.cardText}>
              To maintain data integrity and prevent performance tempering, all modifications made to goals after manager lock date are logged dynamically. These logs capture who changed what, the exact old vs. new values, and the precise timestamp.
            </p>
          </div>

          {/* Card 3: Role Access Control */}
          <div className={styles.card}>
            <Users size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Role-Based Access Control</h2>
            <p className={styles.cardText}>
              Goal sheets, quarterly check-in reviews, and feedback comments are restricted based on organizational reporting lines. Subordinate goal entries are only viewable by direct managers, skip-level executives, and authorized HR Administrators.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>1. Data Collection &amp; Intent</h2>
          <p className={styles.sectionText}>
            AtomQuest collects goals, planned target values, units of measure, quarterly achievements, and check-in logs. The collection is strictly for internal talent development, compliance reviews, and quarter-on-quarter organizational strategy alignment.
          </p>

          <h2 className={styles.sectionTitle}>2. Retention &amp; Data Portability</h2>
          <p className={styles.sectionText}>
            Performance sheets and check-in logs are maintained for the active fiscal cycle. Administrative users can export standard compliance and achievement lists as CSV files. All data is backed up securely under encrypted RDS protocols.
          </p>

          <h2 className={styles.sectionTitle}>3. Contact &amp; Compliance Officers</h2>
          <p className={styles.sectionText}>
            For inquiries regarding access locks, org hierarchy overrides, or security logs, please contact the Atomberg IT &amp; HR Governance desk at <strong style={{ color: "var(--primary)" }}>governance@atomberg.com</strong>.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Atomberg Technologies. All rights reserved. Internal Hackathon Portal.</p>
      </footer>
    </div>
  );
}
