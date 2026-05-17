"use client";

import { useState, useTransition } from "react";
import { updateAchievement } from "@/lib/actions";
import { computeProgressScore, formatScore } from "@/lib/scoring";
import { UoMType, GoalPhase, ProgressStatus } from "@prisma/client";
// import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Save } from "lucide-react";
import tableStyles from "@/components/GoalForm/GoalForm.module.css";

type Goal = {
  id: string;
  title: string;
  target: number | null;
  uom: string;
  weightage: number;
  isShared: boolean;
  achievements: { quarter: GoalPhase; actualValue: number | null; progressStatus: ProgressStatus }[];
};

export default function AchievementTracker({ 
  goals,
  lockedQuarters = []
}: { 
  goals: Goal[];
  lockedQuarters?: string[];
}) {
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const isQuarterLocked = lockedQuarters.includes(activeQuarter);

  const handleSave = (goalId: string, formData: FormData) => {
    if (isQuarterLocked) return;
    setMessage("");
    const actualValue = parseFloat(formData.get("actualValue") as string) || 0;
    const status = formData.get("progressStatus") as string;
    
    startTransition(async () => {
      try {
        await updateAchievement(goalId, activeQuarter, actualValue, status);
        setMessage("Saved successfully");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        const e = err as Error;
        setMessage(e.message);
      }
    });
  };

  return (
    <div className={tableStyles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Record Achievements</h3>
        <select 
          className={tableStyles.input} 
          style={{ width: "150px" }}
          value={activeQuarter}
          onChange={(e) => setActiveQuarter(e.target.value)}
        >
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      </div>
      
      {isQuarterLocked ? (
        <div style={{ padding: "0.75rem", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.8125rem", color: "#991b1b" }}>
          🔒 <strong>Check-in Completed:</strong> The {activeQuarter} check-in discussion has been completed and locked by your manager. Achievements for this quarter can no longer be modified.
        </div>
      ) : (
        <div style={{ padding: "0.75rem", backgroundColor: "var(--info-bg, #e0f2fe)", border: "1px solid var(--info-border, #bae6fd)", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--info-text, #0369a1)" }}>
          <strong>💡 Hackathon Note:</strong> All quarterly check-in windows (Q1-Q4) are manually accessible for end-to-end testing. In production, these windows are system-locked to their respective months (July, Oct, Jan, March) as per the BRD.
        </div>
      )}

      {message && <div style={{ color: "var(--success)", fontSize: "0.875rem", marginBottom: "1rem" }}>{message}</div>}

      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>GOAL</th>
              <th>TARGET</th>
              <th>{activeQuarter} ACTUAL</th>
              <th>SCORE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal: Goal) => {
              const achievement = goal.achievements.find(a => a.quarter === activeQuarter);
              
              return (
                <tr key={goal.id}>
                  <td className={tableStyles.goalTitle} style={{ maxWidth: "250px" }}>
                    <div style={{ fontWeight: 500 }}>{goal.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Weight: {goal.weightage}% | UoM: {goal.uom}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{goal.target ?? "—"}</td>
                  
                  <td colSpan={4} style={{ padding: 0 }}>
                    <form action={(fd) => handleSave(goal.id, fd)} style={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <div style={{ flex: "1 1 25%", padding: "1rem 1.25rem" }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          name="actualValue" 
                          className={tableStyles.input} 
                          defaultValue={achievement?.actualValue || ""}
                          placeholder="e.g. 95"
                          required={goal.target !== null && goal.uom !== "TIMELINE"}
                          disabled={goal.isShared || isPending || isQuarterLocked}
                        />
                      </div>
                      <div style={{ flex: "1 1 20%", padding: "1rem 1.25rem" }}>
                        {achievement ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--primary)" }}>
                              {formatScore(computeProgressScore(goal.uom as UoMType, goal.target, achievement.actualValue, achievement.progressStatus))}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>—</span>
                        )}
                      </div>
                      <div style={{ flex: "1 1 35%", padding: "1rem 1.25rem" }}>
                        <select 
                          name="progressStatus" 
                          className={tableStyles.input}
                          defaultValue={achievement?.progressStatus || "NOT_STARTED"}
                          disabled={goal.isShared || isPending || isQuarterLocked}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="ON_TRACK">On Track</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      <div style={{ flex: "1 1 20%", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "center" }}>
                        {isQuarterLocked ? (
                          <span style={{ fontSize: "0.8125rem", color: "#b91c1c", backgroundColor: "#fef2f2", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.25rem", border: "1px solid #fca5a5" }}>
                            🔒 Locked
                          </span>
                        ) : (
                          <button type="submit" className="btn btn-secondary" disabled={isPending || goal.isShared} style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}>
                            <Save size={14} /> {isPending ? "Saving..." : "Save"}
                          </button>
                        )}
                        {goal.isShared && (
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center" }}>
                            Auto-syncs from Owner
                          </span>
                        )}
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
