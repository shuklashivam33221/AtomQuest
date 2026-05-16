"use client";

import { useState, useTransition } from "react";
import { createCycle, toggleCycleStatus } from "@/lib/actions";
import styles from "../page.module.css";
import { Plus, Power } from "lucide-react";

type Cycle = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  phase: string;
  isActive: boolean;
};

export default function CycleManagerClient({ cycles }: { cycles: Cycle[] }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createCycle(name, startDate, endDate);
      setShowForm(false);
      setName("");
      setStartDate("");
      setEndDate("");
    });
  };

  const handleToggle = (cycleId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleCycleStatus(cycleId, !currentStatus);
    });
  };

  return (
    <div>
      <div className={styles.tableWrapper} style={{ marginTop: "1rem" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CYCLE NAME</th>
              <th>PHASE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <td style={{ fontWeight: 500 }}>{cycle.name}</td>
                <td>{cycle.phase}</td>
                <td>
                  {cycle.isActive ? (
                    <span className={styles.badgeSuccess}>Active</span>
                  ) : (
                    <span className={styles.badgeSoftSuccess} style={{ backgroundColor: "var(--background)", color: "var(--text-secondary)" }}>Inactive</span>
                  )}
                </td>
                <td>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={() => handleToggle(cycle.id, cycle.isActive)}
                    disabled={isPending}
                  >
                    <Power size={12} /> {cycle.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem" }}>
        {showForm ? (
          <form onSubmit={handleCreate} style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>Create New Cycle</h4>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Cycle Name</label>
                <input type="text" className="input" style={{ width: "100%" }} value={name} onChange={e => setName(e.target.value)} required disabled={isPending} placeholder="e.g. FY26 H2" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Start Date</label>
                <input type="date" className="input" style={{ width: "100%" }} value={startDate} onChange={e => setStartDate(e.target.value)} required disabled={isPending} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>End Date</label>
                <input type="date" className="input" style={{ width: "100%" }} value={endDate} onChange={e => setEndDate(e.target.value)} required disabled={isPending} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={isPending}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "Creating..." : "Create Cycle"}</button>
            </div>
          </form>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} style={{ marginRight: "0.5rem" }}/> Create New Cycle
          </button>
        )}
      </div>
    </div>
  );
}
