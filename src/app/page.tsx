import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Target } from "lucide-react";
import styles from "./home.module.css";

export const metadata = {
  title: "AtomQuest — Goal Setting & Tracking Portal",
  description: "A premium, digital Goal Setting & Tracking Portal.",
};

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.page}>
      
      {/* Navbar */}
      <nav className={styles.marketingNav}>
        <Link href="/" className={styles.logoFlex}>
          <div className={styles.logoIcon}>
            <Target strokeWidth={2.5} size={24} />
          </div>
          <span className={styles.logoText}>AtomQuest</span>
        </Link>
        
        <div className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>Product</Link>
          <Link href="#solutions" className={styles.navLink}>Solutions</Link>
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
        </div>

        <div className={styles.navAuth}>
          <Link href="/login" className={styles.loginBtn}>Log In</Link>
          <Link href="/signup" className={styles.signupBtn}>Sign Up Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroContainer}>
        <div className={styles.heroTag}>OKR & Performance Management Software</div>
        <h1 className={styles.heroTitle}>
          Execute Strategy with <span>Precision</span>.
        </h1>
        <p className={styles.heroSub}>
          AtomQuest is the industry-leading OKR platform that helps you align your organization, 
          track progress in real-time, and drive a culture of high performance.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/signup" className={styles.primaryCta}>Get Started Free</Link>
          <Link href="/contact" className={styles.secondaryCta}>Book a Demo</Link>
        </div>

        <div className={styles.heroImageMockup}>
          Dashboard Interface Mockup
        </div>
      </section>

      {/* Trusted By Section */}
      <section className={styles.trustedSection}>
        <div className={styles.trustedText}>Trusted by industry leaders worldwide</div>
        <div className={styles.logos}>
          <span>ACME Corp</span>
          <span>Globex</span>
          <span>Soylent</span>
          <span>Initech</span>
          <span>Umbrella</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureLabel}>Align Teams</div>
            <h2 className={styles.featureTitle}>Connect daily tasks to company goals</h2>
            <p className={styles.featureDesc}>
              Ensure every employee knows exactly how their work impacts the bottom line. 
              Cascade objectives seamlessly from the C-suite down to individual contributors.
            </p>
          </div>
          <div className={styles.featureImage}></div>
        </div>

        <div className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureLabel}>Track Progress</div>
            <h2 className={styles.featureTitle}>Real-time visibility into execution</h2>
            <p className={styles.featureDesc}>
              Stop waiting for quarter-end reviews. Use dynamic dashboards to monitor 
              Key Results, identify bottlenecks early, and pivot strategy instantly.
            </p>
          </div>
          <div className={styles.featureImage}></div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <footer className={styles.footer}>
        <h2 className={styles.footerTitle}>Ready to transform your strategy execution?</h2>
        <Link href="/signup" className={styles.footerCta}>Start your 14-day free trial</Link>
      </footer>
      
    </div>
  );
}
