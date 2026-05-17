<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel" />
</p>

<h1 align="center">⚡ AtomQuest</h1>

<p align="center">
  <strong>In-House Goal Setting & Tracking Portal for Atomberg Technologies</strong>
</p>

<p align="center">
  A production-grade, enterprise OKR (Objectives & Key Results) platform that enables structured goal cascading,<br/>
  quarterly performance tracking, multi-level escalation workflows, and real-time analytics — all in one unified portal.
</p>

<p align="center">
  <a href="https://atom-quest-zeta.vercel.app"><strong>🌐 Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="#-quick-start"><strong>🚀 Quick Start</strong></a> &nbsp;·&nbsp;
  <a href="#-architecture"><strong>🏗️ Architecture</strong></a> &nbsp;·&nbsp;
  <a href="#-features"><strong>✨ Features</strong></a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo & Credentials](#-live-demo--credentials)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [User Journeys by Role](#-user-journeys-by-role)
- [Escalation Engine](#-escalation-engine)
- [Analytics & Reporting](#-analytics--reporting)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Cost Optimization](#-cost-optimization)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

**AtomQuest** was built to solve a real business challenge: **How do organizations align individual employee goals with company-wide objectives, track progress quarterly, and ensure accountability — all without expensive enterprise software?**

This portal digitizes the entire performance management lifecycle:

```
Employee Drafts Goals → Submits for Approval → Manager Reviews & Locks
    → Quarterly Check-ins → Achievement Tracking → Analytics & Reporting
```

Every action is **audited**, every delay is **escalated**, and every insight is **visualized** — in real-time.

---

## 🌐 Live Demo & Credentials

| | |
|---|---|
| **Production URL** | [https://atom-quest-zeta.vercel.app](https://atom-quest-zeta.vercel.app) |
| **Repository** | [github.com/shuklashivam33221/AtomQuest](https://github.com/shuklashivam33221/AtomQuest) |

### One-Click Demo Access

The login page features **Quick Access Demo Buttons** that auto-fill credentials instantly. Alternatively, use the credentials below:

| Role | Email | Password | What You Can Do |
|------|-------|----------|-----------------|
| 👤 **Employee** | `employee@atomberg.com` | `employee123` | Draft goals, submit for approval, log quarterly achievements |
| 👥 **Manager** | `manager@atomberg.com` | `manager123` | Review team goals, approve/return/edit, conduct 1:1 check-ins |
| 🛡️ **Admin** | `admin@atomberg.com` | `admin123` | System-wide control, escalation engine, audit trails, analytics |

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)
Three distinct roles — **Employee**, **Manager**, and **Admin** — each with permission-gated views, server-side session validation, and middleware-enforced route protection. Unauthorized access attempts are automatically redirected.

### 📝 Complete OKR Goal Lifecycle
A structured workflow that enforces data integrity at every step:

```
┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌────────┐
│  DRAFT  │───▸│ SUBMITTED │───▸│ APPROVED by  │───▸│ LOCKED │
│         │    │           │    │   Manager    │    │        │
└─────────┘    └─────┬─────┘    └──────────────┘    └────────┘
                     │                                    
               ┌─────▼─────┐                              
               │ RETURNED  │  (Manager sends back for rework)
               │ for Rework│                              
               └───────────┘                              
```

- **Mandatory 100% Weightage Rule** — Goals cannot be submitted unless total weightage equals exactly 100%
- **Minimum 10% per Goal** — Prevents trivial, low-impact objectives
- **6 Unit-of-Measure Types** — Numeric (Min/Max), Percentage (Min/Max), Timeline, Zero Target
- **Thrust Area Categorization** — Revenue Growth, Customer Satisfaction, Operational Excellence, Innovation & R&D, People Development, Safety & Compliance

### 📊 Quarterly Achievement Tracking
Employees log actual performance values against targets for Q1–Q4. The system **auto-computes progress scores** using UoM-specific formulas:

| UoM Type | Formula | Example |
|----------|---------|---------|
| Numeric (Higher Better) | `(Actual ÷ Target) × 100` | Revenue: ₹45L / ₹50L = 90% |
| Numeric (Lower Better) | `(Target ÷ Actual) × 100` | TAT: 2 days / 3 days = 67% |
| Percentage (Min) | `(Actual ÷ Target) × 100` | CSAT: 96% / 95% = 101% |
| Zero Target | `Actual = 0 ? 100% : 0%` | Safety Incidents: 0 = 100% |
| Timeline | Completion status check | ISO Audit by Mar 31 ✓ |

### 👥 Manager Check-ins & Reviews
A dedicated **1:1 Check-in Interface** with:
- Split-panel layout: Goal progress on the left, manager notes on the right
- Quarter-specific filtering (Q1–Q4)
- Persistent check-in note history with timestamps
- Direct Microsoft Teams meeting integration link
- Inline goal target/weightage editing before approval

### 📈 Real-Time Analytics Dashboard
Interactive **Chart.js** visualizations powered by server-computed data:
- **Quarter-over-Quarter Achievement Trends** — Line chart tracking org-wide performance
- **Department Completion Rates** — Stacked bar chart comparing Draft/Submitted/Locked across departments
- **Goal Distribution Analysis** — Doughnut charts for Thrust Area, UoM type, and Status breakdown
- **Manager Effectiveness Metrics** — Approval rates and check-in completion per manager

### 🛡️ Admin Control Panel
A comprehensive system management interface:
- **Goal Cycle Management** — Create, activate, and advance FY cycles through phases (Goal Setting → Q1 → Q2 → Q3 → Q4 → Annual)
- **Department Shared Goals** — Push organization-level KPIs into all employees of a department simultaneously
- **Organization Hierarchy Manager** — Manual manager assignment + Microsoft Entra ID (Azure AD) sync simulation
- **CSV Export** — Download comprehensive goal + achievement reports
- **Broadcast Reminders** — One-click check-in reminder notifications
- **Goal Unlock** — Emergency override to reopen locked goals for corrections

### ⚡ Escalation Engine
A configurable, rule-based escalation system with multi-level alert progression:

```
Day N+0: Employee receives initial reminder
Day N+3: Manager receives escalation alert  
Day N+7: HR / Skip-level manager receives critical alert
```

Three configurable escalation rules:
| Rule | Default Threshold | Description |
|------|------------------|-------------|
| `GOAL_SUBMISSION_PENDING` | 5 days | Employee hasn't submitted goals |
| `MANAGER_APPROVAL_PENDING` | 3 days | Manager hasn't reviewed submissions |
| `CHECKIN_PENDING` | 7 days | Quarterly check-in overdue |

Each escalation event is logged with timestamp, affected employee, current level, and resolution status — creating a complete **governance audit trail**.

### 📜 Full Audit Trail Logging
Every mutation to a goal record is captured with:
- **Timestamp** of the change
- **Field** that was modified (status, weightage, target, etc.)
- **Old Value → New Value** comparison
- **Actor** who made the change

### 🌍 Company-Wide OKR Board
A public, read-only view of organizational objectives for cross-team alignment and transparency. Accessible to all authenticated users.

### 🔑 Microsoft Entra ID (SSO)
Enterprise Single Sign-On integration via NextAuth.js with Microsoft Entra ID (formerly Azure AD) provider. Supports corporate identity federation for seamless authentication.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│              (React 19 + Server Components)                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS (TLS 1.3)
┌──────────────────────────▼───────────────────────────────────────┐
│                     VERCEL EDGE NETWORK                          │
│              Global CDN · Auto SSL · CI/CD                       │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Next.js 16     │  │  NextAuth v5     │  │  Server        │  │
│  │  App Router     │  │  Session Mgmt    │  │  Actions       │  │
│  │  (RSC + SSR)    │  │  (JWT + Creds    │  │  (Mutations)   │  │
│  │                 │  │   + Entra ID)    │  │                │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │                    │                     │           │
│  ┌────────▼────────────────────▼─────────────────────▼────────┐  │
│  │                    Prisma ORM v7.8                         │  │
│  │          (Type-safe queries · pg adapter · migrations)     │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │ SSL (verify-full)
┌───────────────────────────────▼──────────────────────────────────┐
│                  NEON SERVERLESS POSTGRESQL                       │
│         Auto-suspend · Connection Pooling · Branching            │
│                                                                  │
│  ┌──────┐ ┌──────────┐ ┌──────┐ ┌───────────┐ ┌─────────────┐  │
│  │ User │ │ GoalCycle │ │ Goal │ │Achievement│ │ AuditLog    │  │
│  │      │ │          │ │      │ │           │ │             │  │
│  └──────┘ └──────────┘ └──────┘ └───────────┘ └─────────────┘  │
│  ┌──────────┐ ┌───────────────┐ ┌───────────────┐              │
│  │Department│ │EscalationRule │ │EscalationLog  │              │
│  │          │ │               │ │               │              │
│  └──────────┘ └───────────────┘ └───────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **React Server Components** | Reduces client-side JS bundle by rendering data-fetching components on the server. Pages load faster with zero client-side waterfalls. |
| **Server Actions** | All mutations (create/update/delete) are executed server-side with `"use server"` directives, eliminating the need for separate API routes. |
| **Prisma with `pg` adapter** | Direct PostgreSQL wire protocol via `@prisma/adapter-pg` for maximum compatibility with Neon's serverless architecture. |
| **NextAuth v5 Beta** | Supports both credential-based auth and enterprise SSO (Microsoft Entra ID) with JWT session strategy for stateless, edge-compatible authentication. |
| **CSS Modules** | Scoped styling with zero runtime overhead. No CSS-in-JS bundle cost. |

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.6 | App Router, RSC, SSR, Server Actions |
| **UI Library** | React | 19.2.4 | Component architecture |
| **Language** | TypeScript | 5.x | End-to-end type safety |
| **Auth** | NextAuth.js | 5.0-beta | Credentials + Microsoft Entra ID SSO |
| **ORM** | Prisma | 7.8.0 | Type-safe database queries, migrations |
| **Database** | Neon PostgreSQL | Serverless | Auto-suspend, connection pooling |
| **Charts** | Chart.js + react-chartjs-2 | 4.5 / 5.3 | Interactive analytics visualizations |
| **Icons** | Lucide React | 1.16 | Consistent, lightweight icon system |
| **Validation** | Zod | 4.4 | Runtime schema validation |
| **Hosting** | Vercel | Edge Network | Global CDN, auto CI/CD, SSL |
| **CI** | GitHub Actions | — | Automated lint + type checking |

---

## 🗄️ Database Schema

The application uses **8 interconnected models** with referential integrity:

```
User ──┬── Goal ──┬── Achievement (Q1-Q4 actuals)
       │          ├── CheckIn (Manager notes)
       │          └── AuditLog (Field-level mutations)
       │
       ├── Department
       └── EscalationLog ── EscalationRule
            
GoalCycle ── Goal (FY cycle binding)
```

**Enumerations:**
- `Role`: EMPLOYEE | MANAGER | ADMIN
- `GoalStatus`: DRAFT | SUBMITTED | APPROVED | LOCKED | RETURNED
- `GoalPhase`: GOAL_SETTING | Q1 | Q2 | Q3 | Q4 | ANNUAL
- `UoMType`: NUMERIC_MIN | NUMERIC_MAX | PERCENTAGE_MIN | PERCENTAGE_MAX | TIMELINE | ZERO
- `ProgressStatus`: NOT_STARTED | ON_TRACK | COMPLETED

---

## 🧑‍💼 User Journeys by Role

### Employee Journey
1. **Login** → Land on personal dashboard with active cycle info
2. **Draft Goals** → Add up to 8 goals with thrust areas, UoM, targets, and weightage
3. **Validate** → System enforces 100% total weightage and 10% minimum per goal
4. **Submit** → Goal sheet sent to reporting manager for review
5. **Track Progress** → Log quarterly achievements (Q1–Q4) with actual values
6. **View Score** → Auto-computed progress scores per goal

### Manager Journey
1. **Team Overview** → See all direct reports with goal submission status
2. **Review Goals** → Inspect each employee's goal sheet with inline editing
3. **Approve / Return** → Lock goals or return specific ones for rework
4. **1:1 Check-ins** → Conduct quarterly reviews with persistent notes
5. **Analytics** → View team-level performance trends and department insights
6. **Communication** → Email and calendar integration for scheduling reviews

### Admin Journey
1. **System Dashboard** → KPI cards showing users, cycle status, completion rates
2. **Cycle Management** → Create fiscal year cycles, advance through phases
3. **Escalation Configuration** → Set N-day SLA thresholds per rule type
4. **Run Escalation Engine** → Trigger automated delay detection and multi-level alerts
5. **Org Hierarchy** → Manage employee-manager mappings, sync with Entra ID
6. **Export & Reporting** → Download CSV reports, broadcast check-in reminders
7. **Audit Trail** → Review field-level change history with actor attribution

---

## ⚡ Escalation Engine

The escalation engine is a **configurable, rule-based automation system** that monitors the goal lifecycle for SLA violations:

```
┌─────────────────────┐
│  Admin configures    │
│  N-day thresholds    │──────────────────────────────┐
└─────────────────────┘                               │
                                                      ▼
┌─────────────────────┐    ┌──────────────────────────────────┐
│  Admin triggers      │───▸│  Engine scans all active goals   │
│  "Run Engine"        │    │  against configured thresholds   │
└─────────────────────┘    └──────────────┬───────────────────┘
                                          │
                           ┌──────────────▼───────────────────┐
                           │  For each violation detected:     │
                           │  1. Check existing escalation     │
                           │  2. If none: Create Level 1       │
                           │  3. If exists: Escalate to L2/L3  │
                           │  4. Log details + timestamp       │
                           └──────────────────────────────────┘
```

All escalation events are persisted in the `EscalationLog` table and displayed in real-time on the Admin Panel.

---

## 📈 Analytics & Reporting

The analytics module provides **server-computed, zero-client-overhead** insights:

| Visualization | Type | Data Source |
|--------------|------|-------------|
| QoQ Achievement Trends | Line Chart | Achievements table × UoM formulas |
| Department Completion | Stacked Bar | Goals grouped by department + status |
| Thrust Area Distribution | Doughnut | Goals grouped by thrust area |
| UoM Type Breakdown | Doughnut | Goals grouped by measurement type |
| Status Pipeline | Doughnut | Goals grouped by lifecycle status |
| Manager Effectiveness | Data Table | Check-ins + approval rates per manager |

---

## 🔄 CI/CD Pipeline

### Continuous Integration (GitHub Actions)
Every push to `main` triggers automated quality gates:

```yaml
Build & Lint:
  ✓ Checkout code
  ✓ Setup Node.js 20 with npm cache
  ✓ Install dependencies (npm ci)
  ✓ Generate Prisma client
  ✓ Run ESLint (strict mode)
  ✓ Run TypeScript type checking (tsc --noEmit)
```

### Continuous Deployment (Vercel)
- **Auto-deploy** on every push to `main`
- **Preview deployments** on pull requests
- **Edge Network** distribution across 30+ global regions
- **Auto-provisioned SSL** certificates

---

## 💰 Cost Optimization

The entire infrastructure runs at **$0/month** using free-tier services:

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel Hosting | Hobby | $0 |
| Neon PostgreSQL | Free (0.5 GB) | $0 |
| GitHub Repository | Free | $0 |
| SSL Certificate | Auto-provisioned | $0 |
| **Total** | | **$0/mo** |

### Efficiency Techniques
- **React Server Components** eliminate unnecessary client-side JavaScript bundles
- **Database connection pooling** (max: 10 connections, 30s idle timeout) prevents connection exhaustion in serverless environments
- **Neon auto-suspend** pauses database compute during inactivity periods
- **Inline SVG assets** eliminate external CDN egress costs
- **Selective Prisma queries** with field-level `select` minimize database read capacity usage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL database (or [Neon](https://neon.tech) free account)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/shuklashivam33221/AtomQuest.git
cd AtomQuest

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your database URL and auth secrets

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed demo data (optional)
npx prisma db seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the portal.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
| `AUTH_SECRET` | NextAuth.js session encryption key |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Azure AD application client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Azure AD application client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | Azure AD tenant issuer URL |

---

## 📂 Project Structure

```
atomquest/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI pipeline
├── prisma/
│   ├── schema.prisma              # Database schema (8 models, 5 enums)
│   └── seed.ts                    # Demo data seeding script
├── src/
│   ├── app/
│   │   ├── page.tsx               # Marketing landing page
│   │   ├── login/                 # Split-screen login with SSO
│   │   ├── signup/                # Employee self-registration
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Role-adaptive dashboard
│   │   │   ├── goals/             # Employee goal CRUD
│   │   │   ├── team/              # Manager team overview
│   │   │   │   └── [employeeId]/  # Individual goal review
│   │   │   ├── checkins/          # 1:1 check-in interface
│   │   │   ├── analytics/         # Chart.js visualizations
│   │   │   ├── admin/             # Admin control panel
│   │   │   └── company-okrs/      # Public OKR board
│   │   ├── company-okrs/          # Public company objectives
│   │   ├── support/               # Help center
│   │   └── privacy/               # Privacy policy
│   ├── components/
│   │   ├── GoalForm/              # Goal CRUD with validation
│   │   ├── Sidebar/               # Role-adaptive navigation
│   │   ├── TopNavbar/             # Dashboard top navigation
│   │   └── StatusBadge/           # Reusable status indicators
│   └── lib/
│       ├── auth.ts                # NextAuth configuration
│       ├── prisma.ts              # Database client singleton
│       ├── actions.ts             # Server Actions (all mutations)
│       └── scoring.ts             # UoM-based progress scoring engine
├── eslint.config.mjs              # ESLint flat config
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies & scripts
```

---

<p align="center">
  <strong>Built with ❤️ by Shivam Shukla</strong><br/>
  <sub>AtomQuest Hackathon 1.0 · May 2026</sub>
</p>
