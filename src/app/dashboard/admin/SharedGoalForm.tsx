"use client";

import { useState, useTransition } from "react";
import { pushSharedGoal } from "@/lib/actions";
import { Share2 } from "lucide-react";

export default function SharedGoalForm({ cycleId, departments }: { cycleId: string, departments: { id: string, name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState({ type: "", text: "" });

  const [title, setTitle] = useState("");
  const [uom, setUom] = useState("NUMERIC_MIN");
  const [target, setTarget] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");

  const handlePush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !departmentId) return;

    if (!confirm("Are you sure? This will add this goal to every employee's goal sheet in the selected department.")) {
      return;
    }

    setMessage({ type: "", text: "" });
    startTransition(async () => {
      try {
        await pushSharedGoal(title, uom, target ? parseFloat(target) : null, departmentId, cycleId);
        setMessage({ type: "success", text: "Successfully pushed shared goal." });
        setTitle("");
        setTarget("");
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      }
    });
  };

  if (departments.length === 0) {
    return <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No departments found in the system.</div>;
  }

  return (
    <form onSubmit={handlePush} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {message.text && (
        <div style={{ 
          padding: "0.5rem", 
          borderRadius: "var(--radius-sm)", 
          backgroundColor: message.type === "error" ? "var(--danger-light)" : "var(--success-light)",
          color: message.type === "error" ? "var(--danger)" : "var(--success)",
          fontSize: "0.875rem"
        }}>
          {message.text}
        </div>
      )}

      <div>
        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Goal Title</label>
        <input 
          type="text" 
          className="input" 
          style={{ width: "100%" }}
          placeholder="e.g. Reduce Supply Chain Costs by 5%"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>UoM Type</label>
          <select className="input" style={{ width: "100%" }} value={uom} onChange={e => setUom(e.target.value)} disabled={isPending}>
            <option value="NUMERIC_MIN">Numeric (Min)</option>
            <option value="NUMERIC_MAX">Numeric (Max)</option>
            <option value="PERCENTAGE_MIN">Percentage (Min)</option>
            <option value="PERCENTAGE_MAX">Percentage (Max)</option>
            <option value="TIMELINE">Timeline</option>
            <option value="ZERO">Zero (Boolean)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Target Value</label>
          <input 
            type="number" 
            className="input" 
            style={{ width: "100%" }}
            placeholder="e.g. 5"
            value={target}
            onChange={e => setTarget(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Target Department</label>
        <select className="input" style={{ width: "100%" }} value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={isPending}>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-secondary" disabled={isPending || !title || !departmentId}>
        <Share2 size={16} style={{ marginRight: "0.5rem" }}/>
        {isPending ? "Pushing..." : "Push to Department"}
      </button>
    </form>
  );
}
