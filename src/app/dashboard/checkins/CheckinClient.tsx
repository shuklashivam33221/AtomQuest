"use client";

import { useState, useTransition } from "react";
import { Video, Target, Save } from "lucide-react";
import styles from "./Checkins.module.css";
import { saveCheckIn } from "@/lib/actions";
import { computeProgressScore, formatScore } from "@/lib/scoring";
import { UoMType } from "@prisma/client";

type Goal = {
  id: string;
  title: string;
  thrustArea: string;
  uom: string;
  weightage: number;
  target: number | null;
  achievements: { quarter: string; actualValue: number | null; progressStatus: string }[];
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  goals: Goal[];
};

type CheckIn = {
  id: string;
  goalId: string;
  managerComment: string;
  checkinDate: Date;
  goal?: { employeeId: string };
};

export default function CheckinClient({
  teamMembers,
  initialCheckins,
}: {
  teamMembers: TeamMember[];
  initialCheckins: CheckIn[];
}) {
  const [activeMemberId, setActiveMemberId] = useState(teamMembers[0]?.id || "");
  const [comment, setComment] = useState("");
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [isPending, startTransition] = useTransition();

  const activeMember = teamMembers.find(m => m.id === activeMemberId);
  const activeGoals = activeMember?.goals ?? [];

  const handleSave = () => {
    if (!comment.trim()) return;

    if (activeGoals.length === 0) {
      alert("Cannot save check-in. The employee has no active goals to link this feedback against.");
      return;
    }
    
    startTransition(async () => {
      const targetGoalId = activeGoals[0].id;
      await saveCheckIn(targetGoalId, activeQuarter, comment);
      setComment("");
      alert("Check-in saved successfully!");
    });
  };

  const memberCheckins = initialCheckins.filter(c => c.goal?.employeeId === activeMember?.id);

  return (
    <div className={styles.wrapper}>
      {/* ── Left Sidebar (List of 1:1s) ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>My 1:1s</h2>
        </div>
        
        <div className={styles.list}>
          {teamMembers.map(member => (
            <div 
              key={member.id} 
              className={`${styles.listItem} ${activeMemberId === member.id ? styles.listItemSelected : ""}`}
              onClick={() => setActiveMemberId(member.id)}
            >
              <div className={styles.avatar}>{member.name.substring(0, 2).toUpperCase()}</div>
              <div className={styles.listContent}>
                <div className={styles.listName}>{member.name}</div>
                <div className={styles.listDate}>
                  <span className={styles.calendarIcon}>🗓</span> {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {activeMember && (
        <div className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.largeAvatar}>{activeMember.name.substring(0, 2).toUpperCase()}</div>
              <div>
                <h1 className={styles.mainTitle}>1:1 with {activeMember.name}</h1>
                <div className={styles.mainSubtitle}>{activeMember.role}</div>
              </div>
            </div>
            <div className={styles.headerActions}>
              <select 
                className="input" 
                style={{ padding: "0.25rem 0.5rem", marginRight: "1rem" }}
                value={activeQuarter}
                onChange={(e) => setActiveQuarter(e.target.value)}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
              <a 
                href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_AtomQuestDemo" 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary" 
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
              >
                <Video size={16} /> Join Call
              </a>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Left Column: Planned vs Actual */}
            <div className={styles.leftCol}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}><Target size={16} style={{ color: "var(--primary)" }}/> Goal Progress: Planned vs Actual</div>
              </div>

              {activeGoals.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)" }}>
                  No active/locked goals for this cycle.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeGoals.map(goal => {
                    const achievement = goal.achievements.find(a => a.quarter === activeQuarter);
                    return (
                      <div key={goal.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", backgroundColor: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", gap: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block" }}>{goal.thrustArea}</span>
                            <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#1A1A1A", display: "block", marginTop: "0.125rem" }}>{goal.title}</span>
                          </div>
                          {achievement && (
                            <span style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: achievement.progressStatus === "COMPLETED" ? "#ecfdf5" : achievement.progressStatus === "ON_TRACK" ? "#fffbeb" : "#f3f4f6",
                              color: achievement.progressStatus === "COMPLETED" ? "#047857" : achievement.progressStatus === "ON_TRACK" ? "#b45309" : "#4b5563",
                              border: achievement.progressStatus === "COMPLETED" ? "1px solid #a7f3d0" : achievement.progressStatus === "ON_TRACK" ? "1px solid #fde68a" : "1px solid #e5e7eb",
                              whiteSpace: "nowrap"
                            }}>
                              {achievement.progressStatus === "COMPLETED" ? "✓ Completed" : achievement.progressStatus === "ON_TRACK" ? "⚡ On Track" : "○ Not Started"}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.875rem" }}>
                          Weight: <strong>{goal.weightage}%</strong> | UoM: <strong>{goal.uom}</strong>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", backgroundColor: "#F9FAFB", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 500 }}>Target</div>
                            <div style={{ fontWeight: 600, fontSize: "1.125rem", color: "#1a1a1a", marginTop: "0.125rem" }}>{goal.target ?? "—"}</div>
                          </div>
                          <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 500 }}>{activeQuarter} Actual</div>
                            <div style={{ fontWeight: 600, fontSize: "1.125rem", color: achievement?.actualValue !== null && achievement?.actualValue !== undefined ? "#1a1a1a" : "var(--text-muted)", marginTop: "0.125rem" }}>
                              {achievement?.actualValue !== null && achievement?.actualValue !== undefined ? achievement.actualValue : "—"}
                            </div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 500 }}>Progress Score</div>
                            <div style={{ fontWeight: 700, fontSize: "1.125rem", color: achievement ? "var(--success, #059669)" : "var(--text-muted)", marginTop: "0.125rem" }}>
                              {achievement ? formatScore(computeProgressScore(goal.uom as UoMType, goal.target, achievement.actualValue, achievement.progressStatus)) : "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Private Notes */}
            <div className={styles.rightCol}>
              <div className={styles.notesSection}>
                <div className={styles.sectionTitleBlack}>MANAGER CHECK-IN NOTES</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Document the discussion. These notes will be saved against the employee&apos;s profile for the {activeQuarter} check-in window.
                </p>
                <textarea 
                  className={styles.notesArea} 
                  style={{ height: "200px" }}
                  placeholder="Record your feedback and discussion notes here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={isPending || !comment.trim()}
                    style={{ padding: "0.5rem 1rem" }}
                  >
                    <Save size={14} style={{ marginRight: "0.5rem" }}/>
                    {isPending ? "Saving..." : "Save Check-in Notes"}
                  </button>
                </div>
                
                {/* Show past check-ins for this member */}
                <div style={{ marginTop: "2rem" }}>
                  <div className={styles.sectionTitleBlack} style={{ marginBottom: "1rem" }}>PREVIOUS NOTES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {memberCheckins.filter(c => c.managerComment).length > 0 ? (
                      memberCheckins.filter(c => c.managerComment).map(c => (
                        <div key={c.id} style={{ fontSize: "0.8125rem", borderLeft: "2px solid var(--border)", paddingLeft: "0.75rem", color: "var(--text-secondary)" }}>
                          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                            {new Date(c.checkinDate).toLocaleDateString()}
                          </div>
                          {c.managerComment}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No previous check-in notes found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
