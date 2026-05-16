"use client";

import { useRef, useState, useTransition } from "react";
import { createGoal, deleteGoal, submitGoals } from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Trash2, Plus, Send } from "lucide-react";
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

  const totalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
  const draftGoals = existingGoals.filter((g) => g.status === "DRAFT");
  const canSubmit = totalWeightage === 100 && draftGoals.length > 0;
  const allLocked = existingGoals.length > 0 && existingGoals.every((g) => g.status === "LOCKED" || g.status === "APPROVED");

  async function handleCreate(formData: FormData) {
    setError("");
    formData.set("cycleId", cycleId);
    startTransition(async () => {
      try {
        await createGoal(formData);
        formRef.current?.reset();
        setShowForm(false);
      } catch (e: any) {
        setError(e.message || "Failed to create goal");
      }
    });
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this draft goal?")) return;
    startTransition(async () => {
      try {
        await deleteGoal(goalId);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  async function handleSubmit() {
    if (!confirm("Submit all goals for approval? You won't be able to edit after submission.")) return;
    startTransition(async () => {
      try {
        await submitGoals(cycleId);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  return (
    <div className={styles.container}>
      {/* Weightage Summary Bar */}
      <div className={styles.weightageBar}>
        <div className={styles.weightageInfo}>
          <span>Total Weightage</span>
          <strong className={totalWeightage === 100 ? styles.weightageComplete : styles.weightageIncomplete}>
            {totalWeightage}%
          </strong>
          <span className={styles.weightageHint}>/ 100%</span>
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
                  <td><strong>{goal.weightage}%</strong></td>
                  <td><StatusBadge status={goal.status} size="sm" /></td>
                  <td>
                    {goal.status === "DRAFT" && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(goal.id)}
                        disabled={isPending}
                        title="Delete goal"
                      >
                        <Trash2 size={14} />
                      </button>
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
                  <label className={styles.label}>Unit of Measurement *</label>
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
                  <label className={styles.label}>Weightage (%) *</label>
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
              {canSubmit && (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                  <Send size={16} /> {isPending ? "Submitting..." : "Submit All for Approval"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
