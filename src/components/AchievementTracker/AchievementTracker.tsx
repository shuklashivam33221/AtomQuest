"use client";

import { useState, useTransition } from "react";
import { updateAchievement } from "@/lib/actions";
import { computeProgressScore, formatScore } from "@/lib/scoring";
import { UoMType } from "@prisma/client";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Save } from "lucide-react";
import tableStyles from "@/components/GoalForm/GoalForm.module.css";

type Goal = {
  id: string;
  title: string;
  target: number | null;
  uom: string;
  weightage: number;
  achievements: { quarter: string; actualValue: number; progressStatus: string }[];
};

export default function AchievementTracker({ goals }: { goals: Goal[] }) {
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleSave = (goalId: string, formData: FormData) => {
    setMessage("");
    const actualValue = parseFloat(formData.get("actualValue") as string) || 0;
    const status = formData.get("progressStatus") as string;
    
    startTransition(async () => {
      try {
        await updateAchievement(goalId, activeQuarter, actualValue, status);
        setMessage("Saved successfully");
        setTimeout(() => setMessage(""), 2000);
      } catch (e: any) {
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
            {goals.map((goal) => {
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
                      <td style={{ width: "25%", padding: "1rem 1.25rem", borderBottom: "none" }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          name="actualValue" 
                          className={tableStyles.input} 
                          defaultValue={achievement?.actualValue || ""}
                          placeholder="e.g. 95"
                          required={goal.target !== null && goal.uom !== "TIMELINE"}
                        />
                      </td>
                      <td style={{ width: "20%", padding: "1rem 1.25rem", borderBottom: "none" }}>
                        {achievement ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--primary)" }}>
                              {formatScore(computeProgressScore(goal.uom as UoMType, goal.target, achievement.actualValue, achievement.progressStatus))}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ width: "35%", padding: "1rem 1.25rem", borderBottom: "none" }}>
                        <select 
                          name="progressStatus" 
                          className={tableStyles.input}
                          defaultValue={achievement?.progressStatus || "NOT_STARTED"}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="ON_TRACK">On Track</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="AT_RISK">At Risk</option>
                        </select>
                      </td>
                      <td style={{ width: "20%", padding: "1rem 1.25rem", borderBottom: "none" }}>
                        <button type="submit" className="btn btn-secondary" disabled={isPending} style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}>
                          <Save size={14} /> {isPending ? "Saving..." : "Save"}
                        </button>
                      </td>
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
