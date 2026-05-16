import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Target, AlertCircle, CheckCircle, Heart, Zap, FileText, Users } from "lucide-react";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard - Atomberg HR",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className={styles.container}>
      {/* ── Header Section ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Executive Overview</h1>
          <div className={styles.cycleInfo}>
            <Calendar size={14} />
            Performance Cycle: <span className={styles.cycleStrong}>Q3 2026</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-secondary">Write Praise</button>
          <button className="btn btn-primary">Update My Goals</button>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className={styles.statsGrid}>
        {/* Card 1: Company Progress */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Target size={14} /> COMPANY PROGRESS</span>
            <span className={styles.badgeSuccess}>+5%</span>
          </div>
          <div className={styles.statValue}>68%</div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: "68%" }} />
          </div>
        </div>

        {/* Card 2: At Risk Goals */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><AlertCircle size={14} /> AT RISK GOALS</span>
          </div>
          <div className={`${styles.statValue} ${styles.textWarning}`}>12</div>
          <div className={styles.statContext}>3 blocked by dependencies</div>
        </div>

        {/* Card 3: Check-in Rate */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><CheckCircle size={14} /> CHECK-IN RATE</span>
          </div>
          <div className={styles.statValue}>94%</div>
          <div className={styles.statContextFlex}>
            <div className={styles.avatarsList}>
              <div className={styles.miniAvatar}>JD</div>
              <div className={styles.miniAvatar}>AS</div>
              <div className={styles.miniAvatar}>MR</div>
            </div>
            <span>4 pending</span>
          </div>
        </div>

        {/* Card 4: Team Pulse */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}><Heart size={14} /> TEAM PULSE</span>
            <span className={styles.badgeSoftSuccess}>Great</span>
          </div>
          <div className={styles.statValue}>8.4<span className={styles.statSubValue}>/10</span></div>
          <div className={styles.statContext}>Based on recent 1:1 sentiments</div>
        </div>
      </div>

      {/* ── Bottom Section (2 Columns) ── */}
      <div className={styles.bottomGrid}>
        
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Department Alignment</h3>
            <p className={styles.cardSubtitle}>Progress vs Target by business unit</p>
            
            {/* Mock Bar Chart */}
            <div className={styles.chartArea}>
              <div className={styles.chartGridLines}>
                <div className={styles.gridLine}><span>100</span></div>
                <div className={styles.gridLine}><span>75</span></div>
                <div className={styles.gridLine}><span>50</span></div>
                <div className={styles.gridLine}><span>25</span></div>
                <div className={styles.gridLine}><span>0</span></div>
              </div>
              <div className={styles.barsContainer}>
                <div className={styles.barGroup}>
                  <div className={styles.bar} style={{ height: "85%" }}></div>
                  <span className={styles.barLabel}>Sales</span>
                </div>
                <div className={styles.barGroup}>
                  <div className={styles.bar} style={{ height: "60%" }}></div>
                  <span className={styles.barLabel}>R&D</span>
                </div>
                <div className={styles.barGroup}>
                  <div className={styles.bar} style={{ height: "90%" }}></div>
                  <span className={styles.barLabel}>Marketing</span>
                </div>
                <div className={styles.barGroup}>
                  <div className={styles.bar} style={{ height: "80%" }}></div>
                  <span className={styles.barLabel}>Operations</span>
                </div>
                <div className={styles.barGroup}>
                  <div className={styles.bar} style={{ height: "70%" }}></div>
                  <span className={styles.barLabel}>HR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <h3 className={styles.sectionHeading}><Zap size={16} className={styles.headingIcon} /> Your Action Items</h3>
          
          <div className={styles.actionCard}>
            <div className={styles.actionTitle}>Review Marketing Q3 OKRs</div>
            <div className={styles.actionSubtitle}>Requested by Priya Sharma</div>
          </div>
          
          <div className={styles.actionCard}>
            <div className={styles.actionTitle}>Prep for 1:1 with Rahul</div>
            <div className={styles.actionSubtitleWarning}>Overdue by 2 days</div>
          </div>

          <h3 className={styles.sectionHeading} style={{ marginTop: "1.5rem" }}>
            <Users size={16} className={styles.headingIcon} /> Goal Activity
          </h3>
          
          <div className={styles.activityCard}>
            <div className={styles.activityItem}>
              <div className={styles.activityAvatar}>RV</div>
              <div className={styles.activityContent}>
                <p><strong>Rahul Verma</strong> updated progress on <strong>Achieve ₹50Cr revenue from new retail channels</strong></p>
                <div className={styles.activityMeta}>
                  <span className={styles.metaHighlight}>from 38% to 42%</span>
                  <span className={styles.metaTime}>2 hours ago</span>
                </div>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={`${styles.activityAvatar} ${styles.avatarPurple}`}>SK</div>
              <div className={styles.activityContent}>
                <p><strong>Sarah Khan</strong> marked Key Result at risk: Complete beta testing with 100 enterprise clients</p>
                <div className={styles.activityMetaWarning}>Blocked by supply chain delays.</div>
                <div className={styles.metaTime}>5 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
