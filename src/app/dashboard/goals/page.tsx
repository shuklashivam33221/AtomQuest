import styles from "../page.module.css";

export const metadata = {
  title: "Goals & OKRs - Atomberg HR",
};

export default function GoalsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Company OKRs</h1>
          <p className={styles.cycleInfo}>Aligning daily execution with Atomberg's strategic vision.</p>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-primary">+ New Objective</button>
        </div>
      </div>
      
      <div className={styles.card}>
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <p>Goals & OKRs View (To be implemented)</p>
        </div>
      </div>
    </div>
  );
}
