import Link from "next/link";
import { Target, ArrowLeft, Layers, Compass, Globe } from "lucide-react";
import styles from "./company-okrs.module.css";

export const metadata = {
  title: "Company OKRs - AtomQuest",
  description: "Atomberg Technologies top-level corporate objectives and alignment framework.",
};

export default function PublicCompanyOkrsPage() {
  const companyOKRs = [
    {
      id: "comp-1",
      objective: "Scale Atomberg smart appliance market share by 25%",
      thrustArea: "Market Expansion",
      progress: 78,
      owner: "Sales & Marketing",
      krs: [
        "Launch Smart Fan Pro series with dynamic sensor controls (Q1)",
        "Achieve 100k smart appliance integrations across active smart hubs (Q2-Q3)",
        "Onboard 50 premium regional distributorship partners in West/South territories",
      ]
    },
    {
      id: "comp-2",
      objective: "Optimize manufacturing unit throughput & yield rate",
      thrustArea: "Operational Excellence",
      progress: 92,
      owner: "Operations & Engineering",
      krs: [
        "Reduce operational scrap rate to less than 0.8% across assembly lines",
        "Implement real-time sensor monitoring on plastic moulding systems",
        "Achieve 100% compliance on quarterly safety and yield metrics",
      ]
    },
    {
      id: "comp-3",
      objective: "Establish industry-leading performance governance portal",
      thrustArea: "Digital Transformation",
      progress: 100,
      owner: "HR & IT Systems",
      krs: [
        "Deliver AtomQuest Goal Portal with Microsoft Entra ID dynamic sync",
        "Achieve 100% submission compliance within 5 days of cycle launch",
        "Configure automated SLA rule-based escalations to ensure zero checklist delays",
      ]
    },
    {
      id: "comp-4",
      objective: "Build a highly collaborative corporate workspace environment",
      thrustArea: "People & Culture",
      progress: 65,
      owner: "Human Resources",
      krs: [
        "Complete quarterly 1:1 check-in evaluations across all active managers",
        "Establish monthly skip-level feedback loops to address bottlenecks",
        "Coordinate cross-functional smart training workshops for engineering hubs",
      ]
    }
  ];

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logoFlex}>
          <Target size={20} className={styles.logoIcon} />
          <span className={styles.logoText}>AtomQuest Strategic Board</span>
        </Link>
        <Link href="/" className={styles.backHomeBtn}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.tag}>Corporate Alignment &amp; Vision</div>
          <h1 className={styles.title}>Corporate OKRs &amp; Objectives</h1>
          <p className={styles.subtitle}>
            Discover Atomberg Technologies&apos; high-level strategic pillars. We align every individual goal directly to our corporate mission.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <Layers size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Structured Strategy</h2>
            <p className={styles.cardText}>
              Four core Thrust Areas defined by our Board of Directors to focus our engineering, marketing, digital product, and HR teams on singular strategic outcomes.
            </p>
          </div>

          <div className={styles.card}>
            <Compass size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Absolute Focus</h2>
            <p className={styles.cardText}>
              Weightage-based cascading guarantees that daily actions are quantitatively aligned. Employees own clear metrics rather than simple tasks.
            </p>
          </div>

          <div className={styles.card}>
            <Globe size={28} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Open Governance</h2>
            <p className={styles.cardText}>
              Shared KPIs and real-time dashboard analytics give managers and leadership transparency, allowing rapid pivoting and continuous support.
            </p>
          </div>
        </div>

        {/* Detailed OKRs List */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Strategic Objectives</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2rem" }}>
            {companyOKRs.map((okr) => (
              <div key={okr.id} className={styles.okrBlock}>
                <div className={styles.okrHeader}>
                  <div>
                    <span className={styles.thrustTag}>{okr.thrustArea}</span>
                    <h3 className={styles.okrTitle}>{okr.objective}</h3>
                    <div className={styles.okrOwner}>Lead Owner: <strong>{okr.owner}</strong></div>
                  </div>
                  <div className={styles.okrScoreBox}>
                    <div className={styles.okrScore}>{okr.progress}%</div>
                    <div className={styles.okrScoreLabel}>Progress</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.barBg}>
                  <div 
                    className={`${styles.barFill} ${okr.progress === 100 ? styles.barComplete : ""}`} 
                    style={{ width: `${okr.progress}%` }} 
                  />
                </div>

                {/* Key Results */}
                <div>
                  <h4 className={styles.krHeader}>Key Results (KRs)</h4>
                  <ul className={styles.krList}>
                    {okr.krs.map((kr, index) => (
                      <li key={index}>{kr}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Atomberg Technologies. All rights reserved. Public Alignment Desk.</p>
      </footer>
    </div>
  );
}
