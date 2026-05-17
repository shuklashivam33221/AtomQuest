import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award, TrendingUp, Layers, Zap } from "lucide-react";
import styles from "../page.module.css";

export const metadata = {
  title: "Company OKRs - AtomQuest",
};

export default async function CompanyOkrsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  // Top level mock Company OKRs mapped to Thrust Areas for premium corporate experience
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
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🎯 Company OKRs &amp; Strategic Alignment</h1>
          <p className={styles.subtitle}>
            {activeCycle 
              ? `${activeCycle.name} — Phase: ${activeCycle.phase}`
              : "No active goal cycle program"}
          </p>
        </div>
      </div>

      {/* Corporate Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Layers size={14} /> ACTIVE OBJECTIVES</span>
          </div>
          <div className={styles.statValue}>4</div>
          <div className={styles.statContext}>Thrust Areas fully mapped</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Award size={14} /> CORNERSTONE METRIC</span>
          </div>
          <div className={styles.statValue} style={{ color: "var(--success)" }}>83.7%</div>
          <div className={styles.statContext}>Average OKR alignment progress</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><TrendingUp size={14} /> SYSTEM COMPLIANCE</span>
          </div>
          <div className={styles.statValue}>100%</div>
          <div className={styles.statContext}>Rule-based SLA tracking active</div>
        </div>
      </div>

      {/* Objectives Detail Grid */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Zap size={16} style={{ color: "var(--primary)" }} /> Top-Level Corporate Alignment Board
        </h3>
        <p className={styles.cardSubtitle}>
          These high-level company objectives serve as the primary cornerstone targets. Every department, team, and individual contributors goal sheet maps directly into these pillars to guarantee absolute alignment.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1.5rem" }}>
          {companyOKRs.map((okr) => (
            <div 
              key={okr.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                padding: "1.5rem",
                backgroundColor: "rgba(255,255,255,0.01)"
              }}
            >
              {/* Objective Header */}
              <div 
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem"
                }}
              >
                <div>
                  <span 
                    className={styles.thrustTag}
                    style={{
                      backgroundColor: "rgba(253, 184, 19, 0.08)",
                      color: "var(--primary-dark)",
                      textTransform: "uppercase",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      display: "inline-block"
                    }}
                  >
                    {okr.thrustArea}
                  </span>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    {okr.objective}
                  </h4>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    Lead Department: <strong>{okr.owner}</strong>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: okr.progress === 100 ? "var(--success)" : "var(--primary-dark)" }}>
                    {okr.progress}%
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Current Completion</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBarBg} style={{ marginBottom: "1.5rem" }}>
                <div 
                  className={`${styles.progressBarFill} ${okr.progress === 100 ? styles.progressComplete : ""}`} 
                  style={{ width: `${okr.progress}%` }} 
                />
              </div>

              {/* Key Results */}
              <div>
                <h5 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🎯 Key Results (KRs)
                </h5>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  {okr.krs.map((kr, index) => (
                    <li key={index} style={{ marginBottom: "0.25rem" }}>
                      {kr}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
