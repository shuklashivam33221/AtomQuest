"use client";

import { useState } from "react";
import { Target, AlertCircle } from "lucide-react";
import Link from "next/link";
import styles from "./signup.module.css";
import { signUpUser } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  const validateForm = () => {
    if (!name.trim()) return "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
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
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);

      // Create user
      const signUpRes = await signUpUser(formData);
      if (signUpRes?.error) {
        throw new Error(signUpRes.error);
      }

      // Automatically log them in via NextAuth credentials (client-side)
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
         setError("Account created, but auto-login failed. Please go to Login.");
      } else {
         router.push("/dashboard");
         router.refresh();
      }

    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
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
          <h2 className={styles.formTitle}>Create your account</h2>
          <p className={styles.formSub}>Already have an account? <Link href="/login" className={styles.link}>Log In</Link></p>
          
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Corporate Email *</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password *</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={styles.input}
                disabled={loading}
              />
              <span className={styles.hint}>Must be at least 8 characters.</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Job Role (For Demo) *</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <p className={styles.termsText}>
            By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
