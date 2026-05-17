"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Target, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setLoading(true);
    signIn("microsoft-entra-id", { callbackUrl: "/" });
  };

  const handleDemoLogin = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.brandingBox}>
          <Link href="/" className={styles.logoFlex}>
            <div className={styles.logoIcon}>
              <Target strokeWidth={2.5} size={20} />
            </div>
            <span className={styles.logoText}>AtomQuest</span>
          </Link>
          <h1 className={styles.brandingTitle}>Internal Strategy & Goal Portal</h1>
          <p className={styles.brandingSub}>Align your departmental objectives with the company vision. Access restricted to Atomberg employees only.</p>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSub}>Sign in to manage your OKRs and performance.</p>

          {error && <div className={styles.errorMsg} style={{ marginBottom: "1.5rem" }}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@atomberg.com"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={styles.input}
                  style={{ paddingRight: "2.5rem" }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)" }}></div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)" }}></div>
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className={styles.submitBtn}
            style={{
              backgroundColor: "#fff",
              color: "#333",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginTop: 0
            }}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
              <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
            </svg>
            {loading ? "Connecting..." : "Sign in with Microsoft"}
          </button>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Don&apos;t have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
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
    </div>
  );
}
