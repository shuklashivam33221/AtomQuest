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
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="/company-okrs" className={styles.navLink}>Company OKRs</Link>
          <Link href="/support" className={styles.navLink}>Support</Link>
        </div>

        <div className={styles.navAuth}>
          {session?.user ? (
            <>
              <span className={styles.userName}>Hello, {session.user.name}</span>
              <Link href="/dashboard" className={styles.signupBtn}>Go to Dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>Sign In</Link>
              <Link href="/signup" className={styles.signupBtn}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroContainer}>
        <div className={styles.heroTag}>Next-Generation Performance Management</div>
        <h1 className={styles.heroTitle}>
          Empower Your Team to <span>Excel</span>.
        </h1>
        <p className={styles.heroSub}>
          AtomQuest is the industry-leading OKR platform designed to align your organization,
          track progress in real-time, and drive a culture of high performance across all departments.
        </p>
        <div className={styles.ctaGroup}>
          {session?.user ? (
            <Link href="/dashboard" className={styles.primaryCta}>Go to Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={styles.primaryCta}>Sign In to Dashboard</Link>
              <Link href="/signup" className={styles.secondaryCta}>Sign Up</Link>
            </>
          )}
        </div>

        <div className={styles.heroImageMockup}>
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1200" 
            alt="AtomQuest Corporate Strategy" 
            className={styles.mockupImg}
          />
        </div>
      </section>

      {/* Trusted By Section */}
      <section className={styles.trustedSection}>
        <div className={styles.trustedText}>Driving excellence at</div>
        <div className={styles.logos}>
          <span>Atomberg</span>
          <span>Engineering</span>
          <span>Sales</span>
          <span>Operations</span>
          <span>HR & Admin</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureLabel}>GOAL ALIGNMENT</div>
            <h2 className={styles.featureTitle}>Connect daily tasks to company vision</h2>
            <p className={styles.featureDesc}>
              Ensure every employee knows exactly how their work impacts the bottom line.
              Cascade objectives seamlessly from leadership down to individual contributors 
              with our structured thrust areas and weightage system.
            </p>
            <ul className={styles.featureList}>
              <li>System-enforced validation rules</li>
              <li>Thrust area categorization</li>
              <li>Weightage-based accountability</li>
            </ul>
          </div>
          <div className={styles.featureImage}>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" 
              alt="Goal Alignment Visual" 
              className={styles.featureImg}
            />
          </div>
        </div>

        <div className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureLabel}>PROGRESS TRACKING</div>
            <h2 className={styles.featureTitle}>Real-time visibility into execution</h2>
            <p className={styles.featureDesc}>
              Stop waiting for year-end reviews. Use dynamic dashboards to monitor
              Key Results, identify bottlenecks early, and pivot strategy instantly
              based on real achievement data and quarterly check-ins.
            </p>
            <ul className={styles.featureList}>
              <li>Quarterly progress updates</li>
              <li>Auto-computed achievement scores</li>
              <li>Manager check-in comments</li>
            </ul>
          </div>
          <div className={styles.featureImage}>
            <img 
              src="https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=800" 
              alt="Data Progress Tracking" 
              className={styles.featureImg}
            />
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className={styles.valueSection}>
        <div className={styles.valueGrid}>
          <div className={styles.valueCard}>
            <h3>Accountability</h3>
            <p>Weightage-based goal setting ensures focus on what truly matters for the business.</p>
          </div>
          <div className={styles.valueCard}>
            <h3>Transparency</h3>
            <p>Real-time dashboards provide managers and HR full visibility into team progress.</p>
          </div>
          <div className={styles.valueCard}>
            <h3>Agility</h3>
            <p>Quarterly check-in windows allow for mid-course corrections and consistent feedback.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logoFlex} style={{ marginBottom: '1rem' }}>
              <div className={styles.logoIcon}>
                <Target strokeWidth={2.5} size={20} />
              </div>
              <span className={styles.logoText} style={{ color: '#fff' }}>AtomQuest</span>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', maxWidth: '300px' }}>
              The official Goal Setting & Tracking Portal for Atomberg. 
              Driving alignment and performance across the organization.
            </p>
          </div>
          
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Portal</h4>
              <Link href="#features">Internal Docs</Link>
              <Link href="/login">Employee Login</Link>
              <Link href="/signup">Registration</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <a href="https://atomberg.com" target="_blank">About Atomberg</a>
              <Link href="/support">Help Center</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} Atomberg Technologies. All rights reserved.</p>
          <p style={{ color: '#6B7280' }}>Hackathon 1.0 Submission</p>
        </div>
      </footer>

    </div>
  );
}
