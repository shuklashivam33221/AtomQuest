"use client";

import { useState, useTransition } from "react";
import { Plus, Video, Target, Save } from "lucide-react";
import styles from "./Checkins.module.css";
import { saveCheckIn } from "@/lib/actions";

type Goal = {
  id: string;
  title: string;
  target: number | null;
  achievements: { quarter: string; actualValue: number | null }[];
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
    
    startTransition(async () => {
      // In a real app we might attach checkins to specific goals.
      // For this demo, if there are goals, we attach to the first one.
      const targetGoalId = activeGoals.length > 0 ? activeGoals[0].id : "general-checkin";
      await saveCheckIn(targetGoalId, activeQuarter, comment);
      setComment("");
      alert("Check-in saved successfully!");
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* ── Left Sidebar (List of 1:1s) ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>My 1:1s</h2>
          <button className={styles.iconBtn}><Plus size={16} /></button>
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
              <button className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Video size={16} /> Join Call
              </button>
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
                      <div key={goal.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem", backgroundColor: "var(--surface)" }}>
                        <div style={{ fontWeight: 500, marginBottom: "0.5rem" }}>{goal.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>Target:</span> <strong>{goal.target ?? "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>{activeQuarter} Actual:</span> <strong>{achievement?.actualValue ?? "Not Reported"}</strong>
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
                    {initialCheckins.filter(c => c.managerComment).length > 0 ? (
                      initialCheckins.map(c => (
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
