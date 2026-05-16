import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "draft" },
  SUBMITTED: { label: "Submitted", className: "submitted" },
  APPROVED: { label: "Approved", className: "approved" },
  LOCKED: { label: "Locked", className: "locked" },
  RETURNED: { label: "Returned", className: "returned" },
  NOT_STARTED: { label: "Not Started", className: "notStarted" },
  ON_TRACK: { label: "On Track", className: "onTrack" },
  COMPLETED: { label: "Completed", className: "completed" },
  AT_RISK: { label: "At Risk", className: "atRisk" },
  HIGH_PERFORMER: { label: "High Performer", className: "highPerformer" },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, className: "draft" };
  return (
    <span
      className={`${styles.badge} ${styles[config.className] || ""} ${size === "sm" ? styles.sm : ""}`}
    >
      {config.label}
    </span>
  );
}
