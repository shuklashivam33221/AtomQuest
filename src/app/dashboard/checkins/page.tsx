import styles from "../page.module.css";

export const metadata = {
  title: "Check-ins - Atomberg HR",
};

export default function CheckinsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Check-ins</h1>
      </div>
      
      <div className={styles.card}>
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <p>Check-ins View (To be implemented)</p>
        </div>
      </div>
    </div>
  );
}
