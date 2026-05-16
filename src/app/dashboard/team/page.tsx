import styles from "../page.module.css";

export const metadata = {
  title: "My Team - Atomberg HR",
};

export default function TeamPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Organization</h1>
          <p className={styles.cycleInfo}>Manage direct reports, reviews, and continuous feedback.</p>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-secondary">Org Chart</button>
          <button className="btn btn-primary">Request Feedback</button>
        </div>
      </div>
      
      <div className={styles.card}>
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <p>My Team View (To be implemented)</p>
        </div>
      </div>
    </div>
  );
}
