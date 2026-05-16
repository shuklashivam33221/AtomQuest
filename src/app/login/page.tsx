"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import Link from "next/link";
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

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

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
    setError("");
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <Link href="/" style={{ display: "inline-flex", textDecoration: "none", color: "inherit", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div className={styles.logoMark} style={{ backgroundColor: "var(--primary)", borderRadius: "var(--radius-btn)", padding: "4px" }}>
              <Target strokeWidth={2.5} size={20} color="var(--primary-foreground)" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)" }}>AtomQuest</span>
          </Link>
          <h1 className={styles.logoTitle}>Welcome Back</h1>
          <p className={styles.logoSubtitle}>Sign in to manage your OKRs and performance.</p>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div>
            <label htmlFor="email" className={styles.fieldLabel}>
              Corporate Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@atomberg.com"
              className={styles.fieldInput}
              disabled={loading}
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
              disabled={loading}
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

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Don&apos;t have an account? <Link href="/signup" style={{ color: "var(--primary-dark)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>

        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Quick Access — Demo Accounts</p>
          <div className={styles.demoButtons}>
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                type="button"
                className={styles.demoBtn}
                onClick={() => handleDemoLogin(cred)}
                disabled={loading}
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
