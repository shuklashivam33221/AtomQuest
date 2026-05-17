import Link from "next/link";
import { HelpCircle, ArrowLeft, FileText, Settings, Key, AlertTriangle, Mail } from "lucide-react";
import styles from "./support.module.css";

export const metadata = {
  title: "Support & Help Center - AtomQuest",
};

export default function SupportPage() {
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logoFlex}>
          <HelpCircle size={20} className={styles.logoIcon} />
          <span className={styles.logoText}>AtomQuest Help Center</span>
        </Link>
        <Link href="/" className={styles.backHomeBtn}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.title}>How can we help you today?</h1>
          <p className={styles.subtitle}>
            Find step-by-step guides, troubleshoot SSO logins, or get in touch with our HR support desk.
          </p>
        </div>

        {/* Categories */}
        <div className={styles.categories}>
          <div className={styles.categoryCard}>
            <Key size={24} className={styles.categoryIcon} />
            <h3>Identity &amp; Login</h3>
            <p>Troubleshoot Microsoft Entra ID (Azure AD) SSO, dynamic registration, and email verification issues.</p>
          </div>

          <div className={styles.categoryCard}>
            <Settings size={24} className={styles.categoryIcon} />
            <h3>Cycles &amp; Configurations</h3>
            <p>Learn about goal weightage limits (exactly 100%), thrust areas, cycle locks, and admin overrides.</p>
          </div>

          <div className={styles.categoryCard}>
            <FileText size={24} className={styles.categoryIcon} />
            <h3>Check-ins &amp; Progress</h3>
            <p>Understand UoM scoring formulas, lock states, quarterly achievements, and feedback logging loops.</p>
          </div>

          <div className={styles.categoryCard}>
            <AlertTriangle size={24} className={styles.categoryIcon} />
            <h3>Escalation &amp; SLAs</h3>
            <p>Guides on rule-based escalations, overdue limits (Level 1, 2, and 3), and compliance tracking alerts.</p>
          </div>
        </div>

        {/* FAQs */}
        <section className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4>❓ How do I log in for the first time?</h4>
              <p>Simply click the &quot;Sign in with Microsoft&quot; button on the login page. The system will automatically provision your profile, fetch your manager node, and link you to your direct department.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>❓ Why does my goal sheet say &quot;0% weightage&quot;?</h4>
              <p>Your goal sheet can only be submitted to your L1 manager when the sum of weightages of all goals is exactly 100%. Ensure you distribute the weightages before clicking &quot;Submit&quot;.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>❓ My goals are locked. How do I make modifications?</h4>
              <p>After your goals are approved, they are automatically locked for compliance. If you need to make changes, contact your L1 manager or HR Admin to use the &quot;Unlock Goal Sheet&quot; option in the Admin panel.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>❓ What are rule-based escalations?</h4>
              <p>To ensure high compliance, the system monitors delays in submission or approval. Overdue items escalate dynamically (Employee ➔ Manager ➔ HR / Skip-level) after defined N-day limits.</p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className={styles.contactSection}>
          <div className={styles.contactHeader}>
            <Mail size={24} className={styles.contactIcon} />
            <h2>Open a Support Ticket</h2>
          </div>
          <p className={styles.contactSubtitle}>
            Cannot find your answer? Submit your issue below and our HR IT helpdesk will resolve it within 24 hours.
          </p>
          
          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Corporate Email Address</label>
              <input type="email" placeholder="you@atomberg.com" className={styles.input} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select className={styles.select}>
                <option>SSO Authentication Issue</option>
                <option>Goal Weightage &amp; Validation Error</option>
                <option>Check-in Lock Override Request</option>
                <option>Reporting &amp; Org Hierarchy Sync</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description of Issue</label>
              <textarea placeholder="Describe your issue in detail..." className={styles.textarea} required></textarea>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Submit Ticket
            </button>
          </form>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Atomberg Technologies. All rights reserved. Help Center desk.</p>
      </footer>
    </div>
  );
}
