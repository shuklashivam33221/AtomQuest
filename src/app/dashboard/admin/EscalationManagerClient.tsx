"use client";

import { useState, useTransition } from "react";
import { updateEscalationRuleDays, runEscalationEngine } from "@/lib/actions";
import { ShieldAlert, RefreshCw, Save, Clock } from "lucide-react";
import styles from "../page.module.css";

interface EscalationRule {
  id: string;
  triggerType: string;
  daysLimit: number;
}

export default function EscalationManagerClient({ initialRules }: { initialRules: EscalationRule[] }) {
  const [rules, setRules] = useState<EscalationRule[]>(initialRules);
  const [isPending, startTransition] = useTransition();
  const [isEnginePending, startEngineTransition] = useTransition();
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleUpdateDays = async (triggerType: string, daysLimit: number) => {
    setMessage({ type: "", text: "" });
    startTransition(async () => {
      try {
        await updateEscalationRuleDays(triggerType, daysLimit);
        setRules(prev => prev.map(r => r.triggerType === triggerType ? { ...r, daysLimit } : r));
        setMessage({ type: "success", text: `Successfully updated threshold for ${triggerType.replace(/_/g, " ")}.` });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      }
    });
  };

  const handleRunEngine = async () => {
    setMessage({ type: "", text: "" });
    startEngineTransition(async () => {
      try {
        const result = await runEscalationEngine();
        setMessage({ type: "success", text: result.message });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      }
    });
  };

  const friendlyName = (type: string) => {
    if (type === "GOAL_SUBMISSION_PENDING") return "Employee Goal Submission Delay";
    if (type === "MANAGER_APPROVAL_PENDING") return "Manager Goal Approval Delay";
    if (type === "CHECKIN_PENDING") return "Quarterly Check-In Capture Delay";
    return type.replace(/_/g, " ");
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {rules.map((rule) => (
          <div 
            key={rule.id} 
            className={styles.statCard} 
            style={{ 
              flex: "1 1 280px", 
              padding: "1.25rem", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              backgroundColor: "rgba(255,255,255,0.01)" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Clock size={16} style={{ color: "var(--info)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{friendlyName(rule.triggerType)}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Threshold:</span>
              <input 
                type="number" 
                min={1} 
                max={90}
                value={rule.daysLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setRules(prev => prev.map(r => r.id === rule.id ? { ...r, daysLimit: val } : r));
                }}
                className="input" 
                style={{ width: "70px", padding: "0.25rem 0.5rem", textAlign: "center" }}
                disabled={isPending}
              />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>days</span>
              
              <button
                type="button"
                onClick={() => handleUpdateDays(rule.triggerType, rule.daysLimit)}
                className="btn btn-secondary"
                style={{ padding: "0.3rem 0.6rem", display: "inline-flex", alignItems: "center", marginLeft: "auto" }}
                disabled={isPending}
              >
                <Save size={12} style={{ marginRight: "0.25rem" }} />
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={handleRunEngine}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          disabled={isEnginePending}
        >
          <RefreshCw size={14} className={isEnginePending ? styles.spin : ""} />
          {isEnginePending ? "Evaluating Escalation Rules..." : "⚙️ Run Rule-Based Escalation Engine"}
        </button>

        {message.text && (
          <div style={{ 
            fontSize: "0.875rem", 
            color: message.type === "error" ? "var(--danger)" : "var(--success)",
            fontWeight: 600 
          }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
