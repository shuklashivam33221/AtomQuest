"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import styles from "./login.module.css";

const DEMO_CREDENTIALS = [
  { label: "Employee", email: "employee@atomberg.com", password: "employee123", role: "Employee" },
  { label: "Manager", email: "manager@atomberg.com", password: "manager123", role: "Manager" },
  { label: "Admin", email: "admin@atomberg.com", password: "admin123", role: "Admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoMark}>
            <Target strokeWidth={2.5} />
          </div>
          <h1 className={styles.logoTitle}>AtomQuest</h1>
          <p className={styles.logoSubtitle}>Goal Setting & Tracking Portal</p>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label htmlFor="email" className={styles.fieldLabel}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@atomberg.com"
              className={styles.fieldInput}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={styles.fieldLabel}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={styles.fieldInput}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Quick Access — Demo Accounts</p>
          <div className={styles.demoButtons}>
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                type="button"
                className={styles.demoBtn}
                onClick={() => handleDemoLogin(cred)}
              >
                {cred.label}
                <span className={styles.roleBadge}>{cred.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
