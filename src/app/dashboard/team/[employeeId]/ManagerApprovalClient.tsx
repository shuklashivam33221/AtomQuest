"use client";

import { useTransition, useState } from "react";
import { approveGoals, returnGoal, editGoalAsManager } from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Check, X, Lock, Save, Edit2 } from "lucide-react";
import tableStyles from "@/components/GoalForm/GoalForm.module.css";

type Goal = {
  id: string;
  title: string;
  thrustArea: string;
  uom: string;
  target: number | null;
  weightage: number;
  status: string;
  isShared: boolean;
};

export default function ManagerApprovalClient({
  employeeId,
  cycleId,
  goals: initialGoals,
  isSubmitted,
  isLocked
}: {
  employeeId: string;
  cycleId: string;
  goals: Goal[];
  isSubmitted: boolean;
  isLocked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  
  // Local state for inline editing
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ target: string; weightage: string }>({ target: "", weightage: "" });

  /* 
  // Sync state if props change (e.g. after server action revalidation)
  useEffect(() => {
    setGoals(() => initialGoals);
  }, [initialGoals]);
  */

  const currentTotalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

  const handleApproveAll = () => {
    if (currentTotalWeightage !== 100) {
      setError(`Cannot approve: Total weightage must be exactly 100%. Currently ${currentTotalWeightage}%`);
      return;
    }
    if (!confirm("Approve and Lock all goals for this employee?")) return;
    startTransition(async () => {
      try {
        await approveGoals(employeeId, cycleId);
        setError("");
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  };

  const handleReturn = (goalId: string) => {
    if (!confirm("Return this specific goal to the employee for rework?")) return;
    startTransition(async () => {
      try {
        await returnGoal(goalId);
        setError("");
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  };

  const startEditing = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditValues({
      target: goal.target !== null ? goal.target.toString() : "",
      weightage: goal.weightage.toString()
    });
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setEditValues({ target: "", weightage: "" });
    setError("");
  };

  const saveEdit = async (goalId: string) => {
    const newWeightage = parseInt(editValues.weightage, 10);
    const newTarget = editValues.target ? parseFloat(editValues.target) : null;

    if (isNaN(newWeightage) || newWeightage < 10) {
      setError("Weightage must be a number and at least 10%.");
      return;
    }

    startTransition(async () => {
      try {
        await editGoalAsManager(goalId, newTarget, newWeightage);
        
        // Optimistic UI update
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, target: newTarget, weightage: newWeightage } : g));
        setEditingGoalId(null);
        setError("");
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  };

  if (goals.length === 0) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Employee has not drafted any goals yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {isLocked && (
        <div style={{ 
          padding: "1rem 1.25rem", 
          backgroundColor: "#e6fffa", 
          border: "1px solid #319795", 
          color: "#234e52", 
          borderRadius: "var(--radius-md)", 
          fontWeight: 500,
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>🎉</span>
          <span><strong>Success:</strong> Goals Approved & Locked. A real-time email notification has been successfully dispatched to the employee notifying them of approval.</span>
        </div>
      )}
      
      {error && <div className={tableStyles.error}>{error}</div>}

      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>GOAL TITLE</th>
              <th>THRUST AREA</th>
              <th style={{ width: "120px" }}>TARGET</th>
              <th style={{ width: "100px" }}>WEIGHTAGE</th>
              <th>STATUS</th>
              {!isLocked && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const isEditing = editingGoalId === goal.id;
              
              return (
                <tr key={goal.id}>
                  <td className={tableStyles.goalTitle}>{goal.title}</td>
                  <td><span className={tableStyles.thrustTag}>{goal.thrustArea}</span></td>
                  
                  <td>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ padding: "0.25rem 0.5rem", width: "100%", height: "32px" }}
                        value={editValues.target}
                        onChange={e => setEditValues({ ...editValues, target: e.target.value })}
                        disabled={isPending || goal.isShared}
                        title={goal.isShared ? "Target cannot be edited for shared goals" : ""}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{goal.target ?? "—"}</span>
                        {goal.isShared && (
                          <span style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 600, marginTop: "0.125rem", textTransform: "uppercase" }}>Shared KPI</span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td>
                    {isEditing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <input 
                          type="number" 
                          className="input" 
                          style={{ padding: "0.25rem 0.5rem", width: "60px", height: "32px" }}
                          value={editValues.weightage}
                          onChange={e => setEditValues({ ...editValues, weightage: e.target.value })}
                          disabled={isPending}
                          min={10}
                          max={100}
                        />
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>%</span>
                      </div>
                    ) : (
                      <strong>{goal.weightage}%</strong>
                    )}
                  </td>
                  
                  <td><StatusBadge status={goal.status} size="sm" /></td>
                  
                  {!isLocked && (
                    <td>
                      {goal.status === "SUBMITTED" && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {isEditing ? (
                            <>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                onClick={() => saveEdit(goal.id)}
                                disabled={isPending}
                                title="Save"
                              >
                                <Save size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                onClick={cancelEditing}
                                disabled={isPending}
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--info)" }}
                                onClick={() => startEditing(goal)}
                                disabled={isPending || editingGoalId !== null}
                                title="Edit Target/Weightage"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}
                                onClick={() => handleReturn(goal.id)}
                                disabled={isPending || editingGoalId !== null}
                                title="Return for Rework"
                              >
                                <X size={14} /> Return
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Weightage Summary Row */}
            {!isLocked && (
              <tr style={{ backgroundColor: "var(--background)", fontWeight: 600 }}>
                <td colSpan={3} style={{ textAlign: "right" }}>Total Weightage:</td>
                <td style={{ color: currentTotalWeightage === 100 ? "var(--success)" : "var(--danger)" }}>
                  {currentTotalWeightage}%
                </td>
                <td colSpan={2}>
                  {currentTotalWeightage !== 100 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 400 }}>
                      (Must be exactly 100% to approve)
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
        {isLocked ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 500 }}>
            <Lock size={16} /> All Goals Approved & Locked
          </div>
        ) : isSubmitted ? (
          <button 
            className="btn btn-primary" 
            onClick={handleApproveAll} 
            disabled={isPending || editingGoalId !== null || currentTotalWeightage !== 100}
          >
            <Check size={16} /> {isPending ? "Approving..." : "Approve & Lock All Goals"}
          </button>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Waiting for employee to submit goals for approval.
          </div>
        )}
      </div>

    </div>
  );
}
