"use client";

import { useState, useTransition } from "react";
import { triggerCheckInReminders } from "@/lib/actions";
import { Bell } from "lucide-react";
import styles from "../page.module.css";

export default function BroadcastRemindersForm({ cycleId }: { cycleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleBroadcast = async () => {
    if (!confirm("Are you sure you want to broadcast check-in reminders to all employees who haven't completed their quarterly check-ins?")) {
      return;
    }

    setMessage({ type: "", text: "" });
    startTransition(async () => {
      try {
        const result = await triggerCheckInReminders(cycleId);
        setMessage({
          type: "success",
          text: `Successfully broadcasted check-in reminders to ${result.reminderCount} employee(s).`
        });
      } catch (err) {
        const e = err as Error;
        setMessage({ type: "error", text: e.message });
      }
    });
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        type="button"
        onClick={handleBroadcast}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
        disabled={isPending}
      >
        <Bell size={14} />
        {isPending ? "Broadcasting Reminders..." : "Broadcast Check-in Reminders"}
      </button>
      
      {message.text && (
        <div style={{ 
          fontSize: "0.8125rem", 
          marginTop: "0.5rem", 
          color: message.type === "error" ? "var(--danger)" : "var(--success)",
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
