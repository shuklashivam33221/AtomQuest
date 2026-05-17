"use client";

import { useRef, useState, useTransition } from "react";
import { createGoal, deleteGoal, submitGoals, editGoalAsEmployee } from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Trash2, Plus, Send, Edit2, Save, X } from "lucide-react";
import styles from "./GoalForm.module.css";

type GoalFormProps = {
  cycleId: string;
  existingGoals: Array<{
    id: string;
    title: string;
    thrustArea: string;
    uom: string;
    target: number | null;
    weightage: number;
    status: string;
    isShared: boolean;
  }>;
};

const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Satisfaction",
  "Operational Excellence",
  "Innovation & R&D",
  "People Development",
  "Safety & Compliance",
];

const UOM_OPTIONS = [
  { value: "NUMERIC_MIN", label: "Numeric (Higher is Better)" },
  { value: "NUMERIC_MAX", label: "Numeric (Lower is Better)" },
  { value: "PERCENTAGE_MIN", label: "Percentage (Higher is Better)" },
  { value: "PERCENTAGE_MAX", label: "Percentage (Lower is Better)" },
  { value: "TIMELINE", label: "Timeline (Date-based)" },
  { value: "ZERO", label: "Zero Target" },
];

export default function GoalForm({ cycleId, existingGoals }: GoalFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editWeightage, setEditWeightage] = useState<string>("");

  const totalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
  const draftGoals = existingGoals.filter((g) => g.status === "DRAFT");
  const canSubmit = totalWeightage === 100 && draftGoals.length > 0;
  const allLocked = existingGoals.length > 0 && existingGoals.every((g) => g.status === "LOCKED" || g.status === "APPROVED");
  const isSubmitted = existingGoals.length > 0 && existingGoals.every((g) => g.status === "SUBMITTED" || g.status === "LOCKED" || g.status === "APPROVED");

  async function handleCreate(formData: FormData) {
    setError("");
    formData.set("cycleId", cycleId);
    startTransition(async () => {
      try {
        await createGoal(formData);
        formRef.current?.reset();
        setShowForm(false);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Failed to create goal");
      }
    });
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this draft goal?")) return;
    startTransition(async () => {
      try {
        await deleteGoal(goalId);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  }

  const startEditing = (goal: any) => {
    setEditingGoalId(goal.id);
    setEditWeightage(goal.weightage.toString());
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setEditWeightage("");
    setError("");
  };

  const saveEdit = async (goalId: string) => {
    const weightageNum = parseInt(editWeightage, 10);
    if (isNaN(weightageNum) || weightageNum < 10) {
      setError("Weightage must be at least 10%");
      return;
    }
    startTransition(async () => {
      try {
        await editGoalAsEmployee(goalId, weightageNum);
        setEditingGoalId(null);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  };

  async function handleSubmit() {
    if (!confirm("Submit all goals for approval? You won't be able to edit after submission.")) return;
    startTransition(async () => {
      try {
        await submitGoals(cycleId);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      }
    });
  }

  return (
    <div className={styles.container}>
      {isSubmitted && (
        <div style={{ 
          padding: "1rem 1.25rem", 
          backgroundColor: "#e6fffa", 
          border: "1px solid #319795", 
          color: "#234e52", 
          borderRadius: "var(--radius-md)", 
          marginBottom: "1.5rem", 
          fontWeight: 500,
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>🎉</span> 
          <span><strong>Success:</strong> Goal sheet submitted. Real-time email alerts have been successfully dispatched to your reporting manager for review.</span>
        </div>
      )}
      {/* Weightage Summary Bar */}
      <div className={styles.weightageBar}>
        <div className={styles.weightageInfo}>
          <span>Total Weightage</span>
          <strong className={totalWeightage === 100 ? styles.weightageComplete : styles.weightageIncomplete}>
            {totalWeightage}%
          </strong>
          <span className={styles.weightageHint}>/ 100%</span>
          {totalWeightage < 100 && (
            <span className={styles.weightageRemaining}>({100 - totalWeightage}% more required to submit)</span>
          )}
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${totalWeightage === 100 ? styles.fillComplete : ""}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          />
        </div>
      </div>

      {/* Goals Table */}
      {existingGoals.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>GOAL TITLE</th>
                <th>THRUST AREA</th>
                <th>UoM</th>
                <th>TARGET</th>
                <th>WEIGHTAGE</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {existingGoals.map((goal) => (
                <tr key={goal.id}>
                  <td className={styles.goalTitle}>{goal.title}</td>
                  <td><span className={styles.thrustTag}>{goal.thrustArea}</span></td>
                  <td className={styles.uomCell}>{UOM_OPTIONS.find(u => u.value === goal.uom)?.label || goal.uom}</td>
                  <td>{goal.target ?? "—"}</td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ padding: "0.25rem 0.5rem", width: "60px", height: "32px", minHeight: "auto" }}
                          value={editWeightage}
                          onChange={e => setEditWeightage(e.target.value)}
                          disabled={isPending}
                          min={10}
                          max={100}
                        />
                        <span style={{ fontSize: "0.875rem" }}>%</span>
                      </div>
                    ) : (
                      <strong>{goal.weightage}%</strong>
                    )}
                  </td>
                  <td><StatusBadge status={goal.status} size="sm" /></td>
                  <td>
                    {goal.status === "DRAFT" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {editingGoalId === goal.id ? (
                          <>
                            <button className="btn btn-primary" style={{ padding: "0.25rem 0.5rem" }} onClick={() => saveEdit(goal.id)} disabled={isPending} title="Save">
                              <Save size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem" }} onClick={cancelEditing} disabled={isPending} title="Cancel">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", color: "var(--info)" }} onClick={() => startEditing(goal)} disabled={isPending || editingGoalId !== null} title="Edit Weightage">
                              <Edit2 size={14} />
                            </button>
                            {!goal.isShared && (
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(goal.id)}
                                disabled={isPending || editingGoalId !== null}
                                title="Delete goal"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Add Goal Form */}
      {!allLocked && (
        <>
          {showForm ? (
            <form ref={formRef} action={handleCreate} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Goal Title *</label>
                  <input name="title" required className={styles.input} placeholder="e.g., Achieve 95% CSAT Score" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Thrust Area *</label>
                  <select name="thrustArea" required className={styles.input}>
                    <option value="">Select...</option>
                    {THRUST_AREAS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>UoM *</label>
                  <select name="uom" required className={styles.input}>
                    <option value="">Select...</option>
                    {UOM_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Value</label>
                  <input name="target" type="number" step="0.01" className={styles.input} placeholder="e.g., 95" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Weightage (%) * <small>(Min 10%)</small></label>
                  <input name="weightage" type="number" min="10" max={100 - totalWeightage} required className={styles.input} placeholder={`10-${100 - totalWeightage}`} />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Description</label>
                  <textarea name="description" className={styles.textarea} rows={2} placeholder="Brief description of the goal..." />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.addActions}>
              {existingGoals.length < 8 && totalWeightage < 100 && (
                <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
                  <Plus size={16} /> Add Goal
                </button>
              )}
              {totalWeightage === 100 && canSubmit && (
                <div className={styles.submitSection}>
                   <p className={styles.submitNotice}>Total weightage is 100%. You can now submit for approval.</p>
                   <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                     <Send size={16} /> {isPending ? "Submitting..." : "Submit Goal Sheet for Approval"}
                   </button>
                </div>
              )}
              {totalWeightage > 100 && (
                <p className={styles.errorText}>Warning: Total weightage exceeds 100%. Please delete or adjust goals.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
