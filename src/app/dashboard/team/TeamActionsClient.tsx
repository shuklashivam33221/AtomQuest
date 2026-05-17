"use client";

import { useState, useTransition } from "react";
import { requestFeedbackAction } from "@/lib/actions";
import { Users, Mail, X, Check, GitPullRequest, ArrowDown, UserPlus } from "lucide-react";
import styles from "./TeamActions.module.css";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function TeamActionsClient({
  teamMembers,
  managerName,
  managerEmail,
}: {
  teamMembers: TeamMember[];
  managerName: string;
  managerEmail: string;
}) {
  const [isOrgChartOpen, setIsOrgChartOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !subject || !message) {
      setStatusMsg("Please fill out all fields.");
      return;
    }

    startTransition(async () => {
      try {
        await requestFeedbackAction(selectedEmp, subject, message);
        setStatusMsg("Success: Feedback request successfully dispatched via real email!");
        setSelectedEmp("");
        setSubject("");
        setMessage("");
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setStatusMsg("");
        }, 2000);
      } catch (err) {
        const e = err as Error;
        setStatusMsg(e.message || "Failed to send request.");
      }
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn btn-secondary" onClick={() => setIsOrgChartOpen(true)}>
          <Users size={16} style={{ marginRight: "0.25rem" }} /> Org Chart
        </button>
        <button className="btn btn-primary" onClick={() => setIsFeedbackOpen(true)}>
          <Mail size={16} style={{ marginRight: "0.25rem" }} /> Request Feedback
        </button>
      </div>

      {/* 1. ORG CHART MODAL */}
      {isOrgChartOpen && (
        <div className={styles.overlay} onClick={() => setIsOrgChartOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GitPullRequest size={20} style={{ color: "var(--primary)" }} /> My Organization Chart
              </h3>
              <button className={styles.closeBtn} onClick={() => setIsOrgChartOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.treeContainer}>
                {/* Manager / You */}
                <div className={styles.nodeCard + " " + styles.managerNode}>
                  <div className={styles.avatar}>{managerName.substring(0, 2).toUpperCase()}</div>
                  <div style={{ fontWeight: 600 }}>{managerName} (You)</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Reporting Manager</div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>{managerEmail}</div>
                </div>

                <div className={styles.connectorLine}>
                  <ArrowDown size={16} style={{ color: "var(--border)" }} />
                </div>

                {/* Direct Reports */}
                <div className={styles.reportsGrid}>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <div key={member.id} className={styles.nodeCard + " " + styles.reportNode}>
                        <div className={styles.avatar}>{member.name.substring(0, 2).toUpperCase()}</div>
                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{member.role}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.8 }}>{member.email}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)" }}>
                      No direct reports assigned. You can assign direct reports through the Admin Control Panel.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REQUEST FEEDBACK MODAL */}
      {isFeedbackOpen && (
        <div className={styles.overlay} onClick={() => setIsFeedbackOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={20} style={{ color: "var(--primary)" }} /> Request Continuous Feedback
              </h3>
              <button className={styles.closeBtn} onClick={() => setIsFeedbackOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendFeedback}>
              <div className={styles.modalBody}>
                {statusMsg && (
                  <div
                    className={
                      statusMsg.startsWith("Success")
                        ? styles.alertSuccess
                        : styles.alertError
                    }
                  >
                    {statusMsg}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Direct Report *</label>
                  <select
                    className={styles.input}
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    required
                  >
                    <option value="">Choose Employee...</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Request Subject *</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Q1 Goal Setting Check-in, Continuous Performance Review"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Request Message *</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Write a clear request message to the employee..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFeedbackOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending}
                >
                  {isPending ? "Sending Request..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
