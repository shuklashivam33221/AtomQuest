"use client";

import { useState, useTransition } from "react";
import { Plus, Video, MessageSquare, Save } from "lucide-react";
import styles from "./Checkins.module.css";
import { saveCheckIn } from "@/lib/actions";

type TeamMember = {
  id: string;
  name: string;
  role: string;
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
  const [isPending, startTransition] = useTransition();

  const activeMember = teamMembers.find(m => m.id === activeMemberId);

  const handleSave = () => {
    // In a real app, you'd select the specific goal. For the hackathon demo, 
    // we assume a general check-in tied to the first available goal or a generic placeholder.
    if (!comment.trim()) return;
    
    startTransition(async () => {
      // Mock save to first goal ID just for demonstration
      await saveCheckIn("demo-goal-id", "Q3", comment);
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
                  <span className={styles.calendarIcon}>🗓</span> Oct 10, 2026
                </div>
              </div>
              <div className={styles.statusScheduled}>Scheduled</div>
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
                <div className={styles.mainSubtitle}>{activeMember.role} · Oct 10, 2026</div>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Video size={16} /> Join Call
              </button>
              <button className={styles.iconBtn} style={{ border: "none" }}>...</button>
            </div>
          </div>

          <div className={styles.sentimentCard}>
            <div className={styles.sentimentIcon}>😊</div>
            <div>
              <div className={styles.sentimentLabel}>EMPLOYEE SENTIMENT</div>
              <div className={styles.sentimentText}>Marked as "Positive" prior to meeting.</div>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Left Column: Talking Points */}
            <div className={styles.leftCol}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}><MessageSquare size={16} style={{ color: "var(--primary)" }}/> Talking Points</div>
                <button className={styles.textBtn}>+ Add Point</button>
              </div>

              <div className={styles.pointList}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span>Discuss Kerala distributor onboarding feedback</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span>Review Q4 pipeline projections</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span>Resource constraints in South team</span>
                </label>
                <div className={styles.addPoint}>
                  <input type="text" placeholder="Type a new talking point..." className={styles.transparentInput} />
                </div>
              </div>
            </div>

            {/* Right Column: Action Items & Notes */}
            <div className={styles.rightCol}>
              <div className={styles.actionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleBlack}>ACTION ITEMS</div>
                  <button className={styles.iconBtnSmall}><Plus size={14} /></button>
                </div>
                <div className={styles.actionItemBox}>
                  <label className={styles.checkboxLabel} style={{ marginBottom: "0.5rem" }}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span>Send updated pricing sheet</span>
                  </label>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span className={styles.tag}>Me</span>
                    <span className={styles.dateTag}>Oct 12</span>
                  </div>
                </div>
              </div>

              <div className={styles.notesSection}>
                <div className={styles.sectionTitleBlack}>PRIVATE NOTES</div>
                <textarea 
                  className={styles.notesArea} 
                  placeholder="Notes visible only to you..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={isPending || !comment.trim()}
                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                  >
                    {isPending ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
