"use client";

import { useState, useTransition } from "react";
import { updateUserManager, simulateEntraIDSync } from "@/lib/actions";
import { Shield, Search, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import tableStyles from "../page.module.css";

type UserBasic = {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string | null;
};

type OrgHierarchyManagerProps = {
  employees: UserBasic[];
  managers: UserBasic[];
};

export default function OrgHierarchyManager({ employees, managers }: OrgHierarchyManagerProps) {
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filter employees based on search
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleManagerChange(employeeId: string, managerId: string) {
    setError("");
    setSuccess("");
    const selectedManagerId = managerId === "none" ? null : managerId;

    startTransition(async () => {
      try {
        await updateUserManager(employeeId, selectedManagerId);
        setSuccess("Employee reporting manager updated successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Failed to update manager.");
      }
    });
  }

  // Trigger MS Entra ID (Azure AD) dynamic sync simulation
  async function triggerEntraIDSync() {
    setSyncing(true);
    setSyncCompleted(false);
    setSyncLogs([]);
    setError("");
    setSuccess("");

    const steps = [
      "🔄 Initializing connection to Microsoft Graph API...",
      "🔑 Authenticating via secure OAuth 2.0 with Tenant ID 'atomberg.onmicrosoft.com'...",
      "📥 Querying Active Directory users for attribute 'manager'...",
      "🔗 Resolving reporting structure & department alignments...",
      "💾 Updating database hierarchy references in PostgreSQL...",
    ];

    // Simulating progress logs with nice visual delay
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSyncLogs((prev) => [...prev, steps[i]]);
    }

    try {
      const res = await simulateEntraIDSync();
      if (res.success) {
        setSyncLogs((prev) => [
          ...prev,
          `✅ Sync complete! Mapped ${res.count} previously unassigned employees.`,
        ]);
        setSyncCompleted(true);
        setSuccess(res.message);
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Entra ID synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Dynamic Alerts */}
      {error && (
        <div style={{ padding: "0.875rem 1rem", backgroundColor: "#fff5f5", border: "1px solid #e53e3e", color: "#9b2c2c", borderRadius: "var(--radius-md)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: "0.875rem 1rem", backgroundColor: "#f0fff4", border: "1px solid #38a169", color: "#22543d", borderRadius: "var(--radius-md)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={16} /> <span>{success}</span>
        </div>
      )}

      {/* Microsoft Entra ID Sync Simulator UI Card */}
      <div style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(30, 41, 59, 0.03) 0%, rgba(15, 23, 42, 0.05) 100%)", border: "1px solid rgba(0, 0, 0, 0.06)", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--primary)" }} /> 
              Microsoft Entra ID (Azure AD) Sync Engine
            </h4>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Derive direct reporting lines dynamically from Active Directory attributes.
            </p>
          </div>
          <button 
            onClick={triggerEntraIDSync} 
            disabled={syncing}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {syncing ? "Synchronizing..." : "Sync with Entra ID"}
          </button>
        </div>

        {/* Sync Console Logs */}
        {(syncing || syncLogs.length > 0) && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#0f172a", borderRadius: "var(--radius-md)", color: "#38bdf8", fontFamily: "monospace", fontSize: "0.8125rem", maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.375rem", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            {syncLogs.map((log, index) => (
              <div key={index} style={{ color: log.startsWith("✅") ? "#4ade80" : log.startsWith("❌") ? "#f87171" : "#38bdf8" }}>
                {log}
              </div>
            ))}
            {syncing && (
              <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <Loader2 size={12} className="animate-spin" /> Processing Graph API metadata sync...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Manager Assignment & Org Hierarchy Search Dashboard */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Active Employees Mapping</h4>
          <div style={{ position: "relative", width: "240px" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.375rem 0.75rem 0.375rem 2rem",
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                backgroundColor: "var(--bg-card)",
              }}
            />
          </div>
        </div>

        {/* Override Hierarchy Management Table */}
        <div className={tableStyles.tableWrapper} style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th>CURRENT REPORTING LINE</th>
                <th>UPDATE MANAGER ASSIGNMENT</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No employees matching filter found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const currentManager = managers.find((m) => m.id === emp.managerId);
                  const isUnassigned = !emp.managerId;

                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 500 }}>
                        <div>{emp.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>{emp.email}</div>
                      </td>
                      <td>
                        <span className={tableStyles.thrustTag} style={{ textTransform: "capitalize", backgroundColor: "rgba(0, 112, 243, 0.08)", color: "var(--primary)" }}>
                          {emp.role.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        {isUnassigned ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#d97706", fontSize: "0.8125rem", fontWeight: 500, backgroundColor: "#fffbeb", padding: "0.25rem 0.5rem", borderRadius: "9999px" }}>
                            <AlertTriangle size={12} /> No Manager
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#059669", fontSize: "0.8125rem", fontWeight: 500, backgroundColor: "#ecfdf5", padding: "0.25rem 0.5rem", borderRadius: "9999px" }}>
                            <ArrowRight size={12} style={{ color: "#34d399" }} /> {currentManager?.name || "Assigned"}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          value={emp.managerId || "none"}
                          onChange={(e) => handleManagerChange(emp.id, e.target.value)}
                          disabled={isPending}
                          style={{
                            padding: "0.375rem 0.75rem",
                            fontSize: "0.8125rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            backgroundColor: "var(--bg-card)",
                            fontWeight: 500,
                            cursor: "pointer",
                            width: "180px",
                          }}
                        >
                          <option value="none">-- Select Manager --</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
