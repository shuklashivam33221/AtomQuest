# 🏆 ATOMQUEST HACKATHON 1.0 — Complete Battle Plan

## Your Core Concerns (Addressed)

| Concern | Solution |
|---------|----------|
| UI looks AI-generated (gradients, generic colors) | Use **Atomberg's own brand language** — matte, flat, corporate. No gradients. |
| Don't know which tools to use when | Exact tool + prompt given for each step below |
| Confused about execution order | Numbered phases with dependencies clearly marked |
| Need to win, not just participate | Bonus features prioritized by impact-to-effort ratio |

---

## Phase 0 — Design Foundation (DO THIS FIRST, ~2 hours)

> [!CAUTION]
> This is the single most important phase. **Do NOT skip this.** The design is what separates you from every other team using AI tools.

### Step 0.1 — Study Atomberg's Design DNA

**Go to:** [atomberg.com](https://atomberg.com) in your browser

**What to observe and screenshot:**
- Their **color palette**: Primary Yellow `#FDB813`, Black `#1A1A1A`, White `#FFFFFF`, Grey tones
- Their **typography**: Clean sans-serif, minimal, tech-forward
- Their **layout style**: Clean lines, generous whitespace, no flashy gradients
- Their **UI patterns**: Flat buttons, subtle shadows (not glassmorphism), matte finishes

**Key insight:** Atomberg's design is **anti-AI**. It's matte, restrained, corporate-premium. This is your advantage — most AI tools default to gradients and glassmorphism, which is the exact opposite.

### Step 0.2 — Define Your Design System (on paper or Figma)

Your portal's design language should say: *"This was designed by someone who works at Atomberg."*

```
DESIGN TOKENS (Use these EVERYWHERE):

Primary:       #FDB813  (Atomberg Yellow — buttons, accents, active states)
Primary Dark:  #E5A510  (Hover states)
Background:    #FAFAFA  (Light mode main bg — NOT pure white)
Surface:       #FFFFFF  (Cards, panels)
Surface Dark:  #F5F5F5  (Alternate rows, subtle sections)
Text Primary:  #1A1A1A  (Headings)
Text Secondary:#6B7280  (Descriptions, metadata)
Text Muted:    #9CA3AF  (Timestamps, hints)
Border:        #E5E7EB  (Card borders, dividers)
Success:       #059669  (On Track, Completed)
Warning:       #D97706  (At Risk, Pending)
Danger:        #DC2626  (Overdue, Rejected)
Info:          #2563EB  (Informational badges)

Font:          'Inter', sans-serif  (from Google Fonts)
Border Radius: 8px (cards), 6px (buttons), 4px (inputs)
Shadows:       0 1px 3px rgba(0,0,0,0.08)  — subtle, NOT dramatic
```

> [!IMPORTANT]
> **NO gradients. NO glassmorphism. NO dark mode (unless time permits at the very end).** Flat, matte, corporate. This is how you dodge the "AI-look".

### Step 0.3 — Create a Quick Mockup

**Tool:** Go to [v0.dev](https://v0.dev) (Vercel's AI UI generator)

**Prompt to paste:**
```
Design a corporate goal-setting portal dashboard for an HR tool.
Style: Clean, minimal, flat design. NO gradients, NO glassmorphism.
Color scheme: White background (#FAFAFA), yellow accent (#FDB813),
dark text (#1A1A1A), grey secondary text (#6B7280).
Font: Inter. Border radius: 8px. Subtle shadows only.

The dashboard should show:
- Left sidebar with navigation (Dashboard, My Goals, Team, Check-ins, Reports)
- Top bar with user name, role badge, notification bell
- Main area with: summary cards (Total Goals, Completion %, Pending Approvals)
- A table showing goals with columns: Goal Title, Thrust Area, Weightage, Status, Progress
- Status badges: Not Started (grey), On Track (green), Completed (green filled), At Risk (amber)

Make it look like an internal enterprise tool, NOT a consumer SaaS product.
Corporate, clean, serious. Think Lattice or BambooHR, not Notion or Linear.
```

**What to do with the output:**
- **DON'T copy the code** — just study the layout
- Screenshot it for reference
- Note what you like and don't like
- You'll build the actual code yourself in Antigravity with modifications

---

## Phase 1 — Project Setup & Architecture (~1 hour)

### Step 1.1 — Tech Stack Decision

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14+ (App Router)** | SSR, file-based routing, Server Actions = fewer APIs to write |
| Styling | **Vanilla CSS + CSS Modules** | Avoids Tailwind (too recognizable as AI-generated), full control |
| Auth | **NextAuth.js (Auth.js)** | Role-based auth with credentials provider, fast setup |
| Database | **PostgreSQL + Prisma ORM** | Production-grade, type-safe, easy schema changes |
| Hosting DB | **Supabase** (free tier) or **Neon** | Free PostgreSQL hosting, instant setup |
| Deployment | **Vercel** (free tier) | Zero-config Next.js deploy, instant HTTPS |
| Email (bonus) | **Resend** (free tier) | Simple email notifications |

### Step 1.2 — Come to Antigravity and Initialize

**Open Antigravity IDE** → Open a terminal in your `TestExpress` workspace (or create a new folder like `C:\Users\shiva\Desktop\atomquest-portal`)

**Tell me (Antigravity):**
```
Initialize a new Next.js 14 project with App Router in this directory.
Use TypeScript. No Tailwind — I'll use vanilla CSS.
Set up the following folder structure:
/src
  /app          — pages and layouts
  /components   — reusable UI components
  /lib          — database, auth, utilities
  /styles       — global CSS and design tokens
  /types        — TypeScript interfaces
```

### Step 1.3 — Database Schema

**Tell me (Antigravity):**
```
Set up Prisma with PostgreSQL. Create the schema with these models:
- User (id, name, email, password, role [EMPLOYEE/MANAGER/ADMIN], departmentId, managerId)
- Department (id, name)
- GoalCycle (id, name, startDate, endDate, phase [GOAL_SETTING/Q1/Q2/Q3/Q4], isActive)
- Goal (id, title, description, thrustArea, uom [NUMERIC_MIN/NUMERIC_MAX/PERCENTAGE_MIN/PERCENTAGE_MAX/TIMELINE/ZERO], 
        target, weightage, status [DRAFT/SUBMITTED/APPROVED/LOCKED/RETURNED],
        employeeId, cycleId, isShared, sharedFromId, createdAt, updatedAt)
- Achievement (id, goalId, quarter [Q1/Q2/Q3/Q4], actualValue, completionDate, progressStatus [NOT_STARTED/ON_TRACK/COMPLETED])
- CheckIn (id, goalId, quarter, managerComment, checkinDate, managerId)
- AuditLog (id, goalId, field, oldValue, newValue, changedBy, changedAt)

Include proper relations and indexes.
```

---

## Phase 2 — Core UI Components (~3-4 hours)

> [!TIP]
> Build components in isolation FIRST, then assemble pages. This prevents the "wall of code" problem.

### Step 2.1 — Design System CSS

**Tell me (Antigravity):**
```
Create /src/styles/globals.css with my design system.
Use CSS custom properties (variables) for all tokens.
Include: reset, typography scale, spacing scale, color tokens.

Colors: Primary #FDB813, Background #FAFAFA, Surface #FFFFFF, 
Text #1A1A1A, Secondary #6B7280, Border #E5E7EB,
Success #059669, Warning #D97706, Danger #DC2626.

Font: Inter from Google Fonts. 
No gradients. Flat, matte, corporate look.
Subtle shadows only: 0 1px 3px rgba(0,0,0,0.08).
Border radius: 8px cards, 6px buttons, 4px inputs.
```

### Step 2.2 — Shared Components (build these first)

Build these components one at a time by asking me:

| Component | Prompt to give Antigravity |
|-----------|---------------------------|
| **Sidebar** | `Create a collapsible sidebar component with nav items: Dashboard, My Goals, Team (manager only), Check-ins, Reports, Admin (admin only). Use CSS Modules. Flat design, yellow active indicator, no gradients.` |
| **TopBar** | `Create a top bar with: page title, user avatar+name, role badge (Employee/Manager/Admin), notification bell icon. Clean, minimal.` |
| **StatusBadge** | `Create a StatusBadge component that takes a status prop and renders colored badges. Not Started=grey, On Track=green, Completed=dark green, At Risk=amber, Returned=red. Flat style, slight border-radius, no gradients.` |
| **GoalCard** | `Create a GoalCard component showing: goal title, thrust area tag, weightage %, UoM type, status badge, progress bar. Flat card with subtle shadow and border.` |
| **DataTable** | `Create a reusable DataTable component with sortable columns, pagination. Clean horizontal lines, alternating row backgrounds.` |
| **Modal** | `Create a Modal/Dialog component with overlay. For forms and confirmations.` |
| **ProgressBar** | `Create a flat progress bar component. Takes current and max values. Yellow fill on grey track. No rounded ends, flat/square style.` |

### Step 2.3 — The "Human Touch" Editing

After I generate each component:
1. **Rename some variables** to your naming style
2. **Add 1-2 personal comments** like `// TODO: add animation later` or `// keeping this simple for now`
3. **Adjust spacing/colors slightly** — don't use exact AI defaults
4. **Move one utility function** into a separate helper file

---

## Phase 3 — Feature Implementation (~6-8 hours)

### Priority Order (build in this exact sequence):

#### 3.1 — Auth & Role System (1 hour)
```
Prompt: Set up NextAuth.js with credentials provider. Three roles: EMPLOYEE, MANAGER, ADMIN.
Create login page at /login. After login, redirect based on role.
Seed the database with test users:
- admin@atomberg.com / admin123 (Admin)
- manager@atomberg.com / manager123 (Manager)
- employee@atomberg.com / employee123 (Employee)
Use bcrypt for password hashing. Store session with JWT.
```

#### 3.2 — Goal Creation Flow (2 hours)
```
Prompt: Build the goal creation page for employees.
Requirements:
- Form with: Thrust Area (dropdown), Goal Title, Description, UoM type (dropdown), Target value, Weightage
- Live validation: total weightage must = 100%, min 10% per goal, max 8 goals
- Show running total of weightage at bottom
- Save as DRAFT, then SUBMIT button locks editing
- Use Server Actions for form submission, not API routes
```

#### 3.3 — Manager Approval Workflow (1.5 hours)
```
Prompt: Build the manager's team dashboard.
- Show list of team members with goal submission status
- Click on a member → see their goal sheet
- For each goal: inline edit targets/weightage, or click "Return for Rework" with comment
- "Approve All" button that locks the goal sheet
- After approval, goals get LOCKED status, employee can't edit
```

#### 3.4 — Achievement Tracking (1.5 hours)
```
Prompt: Build quarterly achievement entry.
- Employee sees their locked goals in a table
- For each goal: input field for actual achievement, status dropdown (Not Started/On Track/Completed)
- System auto-computes score based on UoM type:
  * MIN (higher is better): Achievement / Target
  * MAX (lower is better): Target / Achievement
  * Timeline: Compare completion date vs deadline
  * Zero: If actual = 0 → 100%, else 0%
- Save button per quarter
```

#### 3.5 — Manager Check-in (1 hour)
```
Prompt: Build manager check-in view.
- See each team member's Planned vs Actual for the current quarter
- Side-by-side comparison table
- Text area for structured check-in comment
- Save check-in with timestamp
```

#### 3.6 — Admin Panel (1 hour)
```
Prompt: Build admin panel with:
- Goal cycle management (create/edit cycles, set active quarter)
- Shared goals: push a departmental KPI to multiple employees
- Goal unlock capability (override locked goals with audit log)
- Completion dashboard: which employees/managers have completed check-ins
- Audit log viewer: table showing all changes after lock date
```

---

## Phase 4 — Reports & Governance (~2 hours)

#### 4.1 — Achievement Report
```
Prompt: Build an exportable achievement report page.
- Table with: Employee Name, Goal Title, Target, Actual, Score, Status
- Filter by department, quarter, status
- Export to CSV button (generate CSV on server, stream download)
- Also add Excel export using a lightweight library
```

#### 4.2 — Completion Dashboard
```
Prompt: Build a real-time completion dashboard.
- Two sections: Goal Setting Completion & Check-in Completion
- Show % completion by department with horizontal bar charts
- List of pending employees/managers
- Use simple HTML canvas or SVG for charts — no heavy chart library
```

#### 4.3 — Audit Trail
```
Prompt: Implement audit logging middleware.
- On every goal update after LOCKED status, log: goalId, field changed, old value, new value, userId, timestamp
- Admin can view full audit log with filters
```

---

## Phase 5 — Bonus Features (Pick 2-3, ~2-3 hours)

> [!TIP]
> **Priority order by impact-to-effort ratio:**
> 1. Email notifications (easiest, high impact) ← DO THIS
> 2. Escalation module (medium effort, impressive) ← DO THIS
> 3. Analytics module (medium effort, visually impressive) ← DO THIS IF TIME
> 4. Azure AD (complex, skip unless you have experience)

#### 5.1 — Email Notifications (30 min)
```
Prompt: Add email notifications using Resend.
- On goal submission → email to manager
- On approval/rejection → email to employee
- Check-in reminder → scheduled or on cycle window open
Use a simple email template with Atomberg yellow header bar.
```

#### 5.2 — Escalation Module (1 hour)
```
Prompt: Build a rule-based escalation system.
- Configurable rules: e.g., "if goals not submitted within 7 days of cycle open → notify employee"
- Escalation chain: employee → manager → HR
- Admin UI to configure escalation rules and view escalation log
- Use a cron-like checker (or Next.js cron via Vercel)
```

#### 5.3 — Analytics Dashboard (1.5 hours)
```
Prompt: Build analytics page with:
- Quarter-on-Quarter achievement trends (line chart)
- Completion heatmap by department (grid of colored cells)
- Goal distribution by Thrust Area (donut chart)
- Manager effectiveness comparison (bar chart)
Use lightweight Chart.js or build SVG charts manually.
Keep charts flat-styled to match the design system.
```

---

## Phase 6 — Polish, Deploy & Demo Prep (~2 hours)

### Step 6.1 — UI Polish Checklist

- [ ] All forms have proper error messages (red text below field, not alerts)
- [ ] Loading states on all buttons (spinner or "Saving...")
- [ ] Empty states ("No goals created yet" with illustration)
- [ ] Responsive layout (works on laptop screens, no mobile needed)
- [ ] Consistent spacing throughout
- [ ] Page titles in browser tab
- [ ] Toast notifications for success/error actions

### Step 6.2 — Anti-AI Polish (Critical!)

| What AI Does | What You Should Do Instead |
|-------------|--------------------------|
| Perfect symmetrical layouts | Add slight visual hierarchy differences |
| Generic "Dashboard" headings | Use contextual headings: "Your Q1 Goal Sheet", "Pending Approvals (3)" |
| Lorem ipsum or generic data | Use realistic Indian names and Atomberg-relevant goals (e.g., "Reduce TAT for fan assembly", "Achieve 95% CSAT score") |
| Gradient progress bars | Flat, solid-color bars |
| Hover effects with scale transforms | Subtle background-color changes only |
| Purple/blue/pink gradients | Yellow + grey + white (Atomberg palette) |
| Glassmorphism cards | Flat cards with subtle 1px border |

### Step 6.3 — Seed Realistic Data

```
Prompt: Create a seed script with realistic data:
- 3 departments: Engineering, Sales, Operations
- 1 Admin, 2 Managers, 6 Employees
- Each employee has 4-6 goals with realistic titles:
  "Achieve 95% CSAT Score", "Reduce Assembly TAT to 2 days",
  "Zero Safety Incidents", "Complete ISO Audit by March",
  "Increase Revenue by 15%"
- Some goals in different statuses (Draft, Submitted, Approved, Locked)
- Q1 achievements partially filled
```

### Step 6.4 — Deploy to Vercel

```
1. Push code to GitHub
2. Go to vercel.com → Import → Select your repo
3. Add environment variables (DATABASE_URL, NEXTAUTH_SECRET)
4. Deploy → get your live URL
```

### Step 6.5 — Architecture Diagram

**Tell me (Antigravity):**
```
Generate a Mermaid architecture diagram for my portal showing:
- Client (Next.js Frontend) → Next.js Server (App Router + Server Actions)
- Next.js Server → PostgreSQL (via Prisma ORM)
- Next.js Server → Resend (Email)
- Auth flow via NextAuth.js
- Hosted on Vercel (frontend + API) and Supabase/Neon (database)
```

Then export it as PNG for your submission.

### Step 6.6 — Demo Preparation

**Create 3 demo scripts (one per role):**

| Role | Demo Flow (2-3 min each) |
|------|-------------------------|
| **Employee** | Login → View Dashboard → Create 5 goals → Set weightage (total=100%) → Submit → See locked goals → Enter Q1 achievement |
| **Manager** | Login → See team dashboard → Review employee's goals → Edit one target → Approve → Do quarterly check-in → Add comment |
| **Admin** | Login → Configure goal cycle → Push shared goal to team → View completion dashboard → Export report → View audit log |

---

## Tool Usage Summary

| Phase | Primary Tool | Secondary Tool |
|-------|-------------|----------------|
| Design mockup | v0.dev (web) | Your eyes + Atomberg.com |
| Project setup | Antigravity (me) | Terminal |
| Components | Antigravity (me) | — |
| Features | Antigravity (me) | — |
| Charts/icons | Antigravity + Chart.js | — |
| Images/empty states | Antigravity image gen | — |
| Deployment | Vercel dashboard | GitHub |
| Architecture diagram | Antigravity (Mermaid) | Export as PNG |

---

## Timeline (If you have ~16-20 hours)

| Time Block | Phase | Duration |
|-----------|-------|----------|
| Block 1 | Phase 0: Design Foundation | 2h |
| Block 2 | Phase 1: Setup & DB | 1h |
| Block 3 | Phase 2: UI Components | 3-4h |
| Block 4 | Phase 3: Core Features | 6-8h |
| Block 5 | Phase 4: Reports | 2h |
| Block 6 | Phase 5: Bonus (pick 2-3) | 2-3h |
| Block 7 | Phase 6: Polish & Deploy | 2h |

---

## Open Questions

> [!IMPORTANT]
> Please answer these so I can tailor the execution:

1. **Workspace location** — Should I build this in `C:\Users\shiva\Desktop\TestExpress` or create a new folder like `C:\Users\shiva\Desktop\atomquest-portal`?

2. **Timeline** — How many hours/days do you have before the hackathon deadline?

3. **Team size** — Are you working solo or with teammates? (affects how we split work)

4. **Database hosting** — Do you already have a Supabase/Neon account, or should I plan for SQLite (simpler but less impressive)?

5. **Deployment** — Do you have a Vercel account? Or would you prefer Render/Railway?

6. **Azure AD** — Do you have access to a Microsoft Entra ID tenant? (If not, we'll skip that bonus feature entirely)

7. **Ready to start?** — Should I begin with Phase 1 (project initialization) right away, or do you want to do Phase 0 (design study) first on your own?
