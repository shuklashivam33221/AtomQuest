"use client";

import { useState, useTransition } from "react";
import { unlockGoalsAsAdmin } from "@/lib/actions";
import { Unlock } from "lucide-react";
import styles from "../page.module.css";

export default function UnlockGoalForm({ cycleId }: { cycleId: string }) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!confirm(`Are you sure you want to unlock goals for ${email}? They will be returned to the employee.`)) {
      return;
    }

    setMessage({ type: "", text: "" });
    startTransition(async () => {
      try {
        await unlockGoalsAsAdmin(email, cycleId);
        setMessage({ type: "success", text: "Successfully unlocked goal sheet." });
        setEmail("");
      } catch (err) {
        const e = err as Error;
        setMessage({ type: "error", text: e.message });
      }
    });
  };

  return (
    <div className={styles.card} style={{ marginTop: "1.5rem" }}>
      <div className={styles.sectionHeading} style={{ color: "var(--danger)" }}>
        <Unlock size={16} className={styles.headingIcon} /> Emergency Goal Unlock
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Override a locked goal sheet to allow an employee to make mid-cycle corrections. Enter the employee&apos;s email address below.
      </p>

      <form onSubmit={handleUnlock} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <input 
            type="email" 
            placeholder="employee@atomberg.com" 
            className="input" 
            style={{ width: "100%" }}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
          {message.text && (
            <div style={{ 
              fontSize: "0.8125rem", 
              marginTop: "0.5rem", 
              color: message.type === "error" ? "var(--danger)" : "var(--success)" 
            }}>
              {message.text}
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="btn btn-secondary" 
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          disabled={isPending || !email}
        >
          {isPending ? "Unlocking..." : "Unlock Sheet"}
        </button>
      </form>
    </div>
  );
}
