"use client";

import { useTransition, useState } from "react";
import { approveGoals, returnGoal } from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Check, X, Lock } from "lucide-react";
import tableStyles from "@/components/GoalForm/GoalForm.module.css";

type Goal = {
  id: string;
  title: string;
  thrustArea: string;
  uom: string;
  target: number | null;
  weightage: number;
  status: string;
};

export default function ManagerApprovalClient({
  employeeId,
  cycleId,
  goals,
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

  const handleApproveAll = () => {
    if (!confirm("Approve and Lock all goals for this employee?")) return;
    startTransition(async () => {
      try {
        await approveGoals(employeeId, cycleId);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const handleReturn = (goalId: string) => {
    if (!confirm("Return this specific goal to the employee for rework?")) return;
    startTransition(async () => {
      try {
        await returnGoal(goalId);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  if (goals.length === 0) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Employee has not drafted any goals yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {error && <div className={tableStyles.error}>{error}</div>}

      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>GOAL TITLE</th>
              <th>THRUST AREA</th>
              <th>TARGET</th>
              <th>WEIGHTAGE</th>
              <th>STATUS</th>
              {!isLocked && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr key={goal.id}>
                <td className={tableStyles.goalTitle}>{goal.title}</td>
                <td><span className={tableStyles.thrustTag}>{goal.thrustArea}</span></td>
                <td>{goal.target ?? "—"}</td>
                <td><strong>{goal.weightage}%</strong></td>
                <td><StatusBadge status={goal.status} size="sm" /></td>
                {!isLocked && (
                  <td>
                    {goal.status === "SUBMITTED" && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}
                        onClick={() => handleReturn(goal.id)}
                        disabled={isPending}
                      >
                        <X size={14} style={{ marginRight: "0.25rem" }}/> Return
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
        {isLocked ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 500 }}>
            <Lock size={16} /> All Goals Approved & Locked
          </div>
        ) : isSubmitted ? (
          <button className="btn btn-primary" onClick={handleApproveAll} disabled={isPending}>
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
