"use client";

import { useState, useTransition } from "react";
import { loginUser, signUpUser } from "@/lib/auth-actions";
import { AlertCircle } from "lucide-react";
import styles from "./home.module.css";
// import { useRouter } from "next/navigation"; // Removed unused import

export default function AuthPanel() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  // const router = useRouter(); // Removed unused router

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        if (activeTab === "login") {
          const res = await loginUser(formData);
          if (res?.error) setError(res.error);
        } else {
          // Signup
          await signUpUser(formData);
          // Auto login after signup
          const res = await loginUser(formData);
          if (res?.error) {
             // If auto login fails, at least redirect to login
             setActiveTab("login");
             setError("Account created! Please log in.");
          }
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "An unexpected error occurred");
      }
    });
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className={styles.authSub}>
          {activeTab === "login" 
            ? "Sign in to manage your objectives" 
            : "Join AtomQuest to align your goals"}
        </p>
      </div>

      <div className={styles.tabs}>
        <button 
          type="button"
          className={`${styles.tabBtn} ${activeTab === "login" ? styles.active : ""}`}
          onClick={() => { setActiveTab("login"); setError(""); }}
        >
          Sign In
        </button>
        <button 
          type="button"
          className={`${styles.tabBtn} ${activeTab === "signup" ? styles.active : ""}`}
          onClick={() => { setActiveTab("signup"); setError(""); }}
        >
          Sign Up
        </button>
      </div>

      <form action={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} style={{ marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === "signup" && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              name="name" 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Rahul Verma" 
              required 
              disabled={isPending}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Corporate Email</label>
          <input 
            name="email" 
            type="email" 
            className={styles.input} 
            placeholder="e.g. name@atomberg.com" 
            required 
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <input 
            name="password" 
            type="password" 
            className={styles.input} 
            placeholder="••••••••" 
            required 
            disabled={isPending}
            minLength={6}
          />
        </div>

        {activeTab === "signup" && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Role (Demo Purposes)</label>
            <select name="role" className={styles.select} disabled={isPending}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin / HR</option>
            </select>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending 
            ? "Please wait..." 
            : (activeTab === "login" ? "Sign In to Dashboard" : "Create Account")}
        </button>
      </form>
    </div>
  );
}
