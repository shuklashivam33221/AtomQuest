"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { TrendingUp, PieChart, BarChart3, Users, Layers, Activity } from "lucide-react";
import styles from "./analytics.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// ── Type Definitions ──
interface QoQDataPoint {
  quarter: string;
  avgScore: number;
  totalGoals: number;
}

interface DepartmentCompletion {
  department: string;
  draft: number;
  submitted: number;
  locked: number;
  returned: number;
  total: number;
}

interface ThrustAreaBreakdown {
  thrustArea: string;
  count: number;
}

interface UoMBreakdown {
  uom: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface ManagerEffectiveness {
  managerId: string;
  managerName: string;
  teamSize: number;
  totalGoals: number;
  lockedGoals: number;
  checkInsCompleted: number;
  totalCheckInsExpected: number;
  approvalRate: number;
  checkinRate: number;
}

interface AnalyticsData {
  qoqTrends: QoQDataPoint[];
  departmentCompletion: DepartmentCompletion[];
  thrustAreaBreakdown: ThrustAreaBreakdown[];
  uomBreakdown: UoMBreakdown[];
  statusBreakdown: StatusBreakdown[];
  managerEffectiveness: ManagerEffectiveness[];
  totalEmployees: number;
  totalGoals: number;
  overallCompletionRate: number;
  avgGoalsPerEmployee: number;
}

// ── Chart Theme Colors ──
const CHART_COLORS = {
  primary: "rgba(253, 184, 19, 0.85)",
  primaryLight: "rgba(253, 184, 19, 0.15)",
  blue: "rgba(37, 99, 235, 0.85)",
  blueLight: "rgba(37, 99, 235, 0.15)",
  green: "rgba(5, 150, 105, 0.85)",
  greenLight: "rgba(5, 150, 105, 0.15)",
  orange: "rgba(217, 119, 6, 0.85)",
  red: "rgba(220, 38, 38, 0.85)",
  purple: "rgba(124, 58, 237, 0.85)",
  purpleLight: "rgba(124, 58, 237, 0.15)",
  gray: "rgba(107, 114, 128, 0.85)",
};

const DOUGHNUT_PALETTE = [
  "#FDB813", "#2563EB", "#059669", "#D97706",
  "#7C3AED", "#DC2626", "#0891B2", "#65A30D",
  "#BE185D", "#6366F1",
];

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: "#6B7280",
        usePointStyle: true,
        pointStyleWidth: 8,
        boxWidth: 8,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: "#1A1A1A",
      titleFont: { family: "'Inter', sans-serif", size: 12, weight: 600 as const },
      bodyFont: { family: "'Inter', sans-serif", size: 11 },
      padding: 10,
      cornerRadius: 6,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: "#9CA3AF",
      },
    },
    y: {
      grid: { color: "rgba(0,0,0,0.04)" },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: "#9CA3AF",
      },
    },
  },
};

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const [qoqLevel, setQoqLevel] = useState<"org" | "department">("org");

  return (
    <>
      {/* ═══════════════════════════════════════════
           SECTION 1: QoQ Achievement Trends
         ═══════════════════════════════════════════ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={16} className={styles.sectionIcon} />
          Quarter-on-Quarter Achievement Trends
        </div>
        <div className={styles.sectionSubtitle}>
          Track average goal achievement scores across quarters to identify performance trajectories.
        </div>

        <div className={styles.tabSelector}>
          <button
            className={`${styles.tab} ${qoqLevel === "org" ? styles.tabActive : ""}`}
            onClick={() => setQoqLevel("org")}
          >
            Organization
          </button>
          <button
            className={`${styles.tab} ${qoqLevel === "department" ? styles.tabActive : ""}`}
            onClick={() => setQoqLevel("department")}
          >
            By Department
          </button>
        </div>

        {qoqLevel === "org" ? (
          <div className={styles.chartContainerWide}>
            {data.qoqTrends.length > 0 ? (
              <Line
                data={{
                  labels: data.qoqTrends.map(d => d.quarter),
                  datasets: [
                    {
                      label: "Avg Achievement Score (%)",
                      data: data.qoqTrends.map(d => d.avgScore),
                      borderColor: CHART_COLORS.primary,
                      backgroundColor: CHART_COLORS.primaryLight,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: "#FDB813",
                      pointBorderColor: "#FFFFFF",
                      pointBorderWidth: 2,
                      borderWidth: 2.5,
                    },
                    {
                      label: "Goals Tracked",
                      data: data.qoqTrends.map(d => d.totalGoals),
                      borderColor: CHART_COLORS.blue,
                      backgroundColor: CHART_COLORS.blueLight,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 7,
                      pointBackgroundColor: "#2563EB",
                      pointBorderColor: "#FFFFFF",
                      pointBorderWidth: 2,
                      borderWidth: 2,
                      yAxisID: "y1",
                    },
                  ],
                }}
                options={{
                  ...BASE_OPTIONS,
                  scales: {
                    ...BASE_OPTIONS.scales,
                    y: {
                      ...BASE_OPTIONS.scales.y,
                      position: "left" as const,
                      title: {
                        display: true,
                        text: "Achievement %",
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: "#9CA3AF",
                      },
                      min: 0,
                      max: 100,
                    },
                    y1: {
                      ...BASE_OPTIONS.scales.y,
                      position: "right" as const,
                      title: {
                        display: true,
                        text: "Goals Count",
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: "#9CA3AF",
                      },
                      grid: { drawOnChartArea: false },
                    },
                  },
                }}
              />
            ) : (
              <div className={styles.emptyChart}>
                <TrendingUp size={28} />
                <span>No quarterly achievement data available yet.</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.chartContainerWide}>
            {data.departmentCompletion.length > 0 ? (
              <Bar
                data={{
                  labels: data.departmentCompletion.map(d => d.department),
                  datasets: [
                    {
                      label: "Locked (Approved)",
                      data: data.departmentCompletion.map(d => d.total > 0 ? Math.round((d.locked / d.total) * 100) : 0),
                      backgroundColor: CHART_COLORS.green,
                      borderRadius: 4,
                      barPercentage: 0.7,
                    },
                    {
                      label: "Submitted",
                      data: data.departmentCompletion.map(d => d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0),
                      backgroundColor: CHART_COLORS.blue,
                      borderRadius: 4,
                      barPercentage: 0.7,
                    },
                    {
                      label: "Draft / Returned",
                      data: data.departmentCompletion.map(d => d.total > 0 ? Math.round(((d.draft + d.returned) / d.total) * 100) : 0),
                      backgroundColor: CHART_COLORS.gray,
                      borderRadius: 4,
                      barPercentage: 0.7,
                    },
                  ],
                }}
                options={{
                  ...BASE_OPTIONS,
                  plugins: {
                    ...BASE_OPTIONS.plugins,
                    legend: { ...BASE_OPTIONS.plugins.legend, position: "top" as const },
                  },
                  scales: {
                    ...BASE_OPTIONS.scales,
                    x: { ...BASE_OPTIONS.scales.x, stacked: true },
                    y: {
                      ...BASE_OPTIONS.scales.y,
                      stacked: true,
                      title: {
                        display: true,
                        text: "Completion %",
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: "#9CA3AF",
                      },
                      max: 100,
                    },
                  },
                }}
              />
            ) : (
              <div className={styles.emptyChart}>
                <BarChart3 size={28} />
                <span>No department-level data available yet.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
           SECTION 2: Department Completion Heatmap
         ═══════════════════════════════════════════ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <Layers size={16} className={styles.sectionIcon} />
          Organization Completion Heatmap
        </div>
        <div className={styles.sectionSubtitle}>
          Visual intensity map showing goal completion rates across departments. Darker cells indicate higher completion.
        </div>

        {data.departmentCompletion.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <div
              className={styles.heatmapGrid}
              style={{ "--cols": 4 } as React.CSSProperties}
            >
              {/* Header Row */}
              <div className={styles.heatmapHeader} style={{ textAlign: "left" }}>Department</div>
              <div className={styles.heatmapHeader}>Draft</div>
              <div className={styles.heatmapHeader}>Submitted</div>
              <div className={styles.heatmapHeader}>Locked</div>
              <div className={styles.heatmapHeader}>Completion %</div>

              {/* Data Rows */}
              {data.departmentCompletion.map((dept) => {
                const completionPct = dept.total > 0 ? Math.round((dept.locked / dept.total) * 100) : 0;
                const heatLevel = completionPct === 0 ? 0 : completionPct <= 20 ? 1 : completionPct <= 40 ? 2 : completionPct <= 60 ? 3 : completionPct <= 80 ? 4 : 5;
                return (
                  <div key={dept.department} style={{ display: "contents" }}>
                    <div className={styles.heatmapLabel}>{dept.department}</div>
                    <div className={`${styles.heatmapCell} ${styles.heat0}`}>{dept.draft + dept.returned}</div>
                    <div className={`${styles.heatmapCell} ${styles[`heat${Math.min(Math.ceil(dept.submitted / Math.max(dept.total, 1) * 5), 5)}`]}`}>{dept.submitted}</div>
                    <div className={`${styles.heatmapCell} ${styles[`heat${Math.min(Math.ceil(dept.locked / Math.max(dept.total, 1) * 5), 5)}`]}`}>{dept.locked}</div>
                    <div className={`${styles.heatmapCell} ${styles[`heat${heatLevel}`]}`}>{completionPct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.emptyChart}>
            <Layers size={28} />
            <span>No department data available for heatmap visualization.</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
           SECTION 3: Goal Distribution Analysis
         ═══════════════════════════════════════════ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <PieChart size={16} className={styles.sectionIcon} />
          Goal Distribution Analysis
        </div>
        <div className={styles.sectionSubtitle}>
          Breakdown of organizational goals by Thrust Area, Unit of Measure, and current status.
        </div>

        <div className={styles.chartRowTriple}>
          {/* Thrust Area Distribution */}
          <div>
            <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
              By Thrust Area
            </h4>
            <div className={styles.chartContainerSmall}>
              {data.thrustAreaBreakdown.length > 0 ? (
                <Doughnut
                  data={{
                    labels: data.thrustAreaBreakdown.map(d => d.thrustArea),
                    datasets: [{
                      data: data.thrustAreaBreakdown.map(d => d.count),
                      backgroundColor: DOUGHNUT_PALETTE.slice(0, data.thrustAreaBreakdown.length),
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                      hoverOffset: 6,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                        labels: {
                          font: { family: "'Inter', sans-serif", size: 10 },
                          color: "#6B7280",
                          usePointStyle: true,
                          pointStyleWidth: 8,
                          boxWidth: 8,
                          padding: 10,
                        },
                      },
                      tooltip: BASE_OPTIONS.plugins.tooltip,
                    },
                  }}
                />
              ) : (
                <div className={styles.emptyChart}><PieChart size={24} /><span>No thrust area data</span></div>
              )}
            </div>
          </div>

          {/* UoM Distribution */}
          <div>
            <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
              By Unit of Measure
            </h4>
            <div className={styles.chartContainerSmall}>
              {data.uomBreakdown.length > 0 ? (
                <Doughnut
                  data={{
                    labels: data.uomBreakdown.map(d => d.uom.replace(/_/g, " ")),
                    datasets: [{
                      data: data.uomBreakdown.map(d => d.count),
                      backgroundColor: ["#2563EB", "#059669", "#D97706", "#7C3AED", "#DC2626", "#0891B2"],
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                      hoverOffset: 6,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                        labels: {
                          font: { family: "'Inter', sans-serif", size: 10 },
                          color: "#6B7280",
                          usePointStyle: true,
                          pointStyleWidth: 8,
                          boxWidth: 8,
                          padding: 10,
                        },
                      },
                      tooltip: BASE_OPTIONS.plugins.tooltip,
                    },
                  }}
                />
              ) : (
                <div className={styles.emptyChart}><PieChart size={24} /><span>No UoM data</span></div>
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div>
            <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
              By Status
            </h4>
            <div className={styles.chartContainerSmall}>
              {data.statusBreakdown.length > 0 ? (
                <Doughnut
                  data={{
                    labels: data.statusBreakdown.map(d => d.status),
                    datasets: [{
                      data: data.statusBreakdown.map(d => d.count),
                      backgroundColor: ["#9CA3AF", "#2563EB", "#059669", "#047857", "#DC2626"],
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                      hoverOffset: 6,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                        labels: {
                          font: { family: "'Inter', sans-serif", size: 10 },
                          color: "#6B7280",
                          usePointStyle: true,
                          pointStyleWidth: 8,
                          boxWidth: 8,
                          padding: 10,
                        },
                      },
                      tooltip: BASE_OPTIONS.plugins.tooltip,
                    },
                  }}
                />
              ) : (
                <div className={styles.emptyChart}><PieChart size={24} /><span>No status data</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
           SECTION 4: Manager Effectiveness Dashboard
         ═══════════════════════════════════════════ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <Users size={16} className={styles.sectionIcon} />
          Manager Effectiveness Dashboard
        </div>
        <div className={styles.sectionSubtitle}>
          Compare check-in completion rates and goal approval velocity across L1 managers.
        </div>

        {data.managerEffectiveness.length > 0 ? (
          <>
            <div className={styles.chartContainer}>
              <Bar
                data={{
                  labels: data.managerEffectiveness.map(m => m.managerName),
                  datasets: [
                    {
                      label: "Approval Rate %",
                      data: data.managerEffectiveness.map(m => m.approvalRate),
                      backgroundColor: CHART_COLORS.green,
                      borderRadius: 4,
                      barPercentage: 0.6,
                    },
                    {
                      label: "Check-In Rate %",
                      data: data.managerEffectiveness.map(m => m.checkinRate),
                      backgroundColor: CHART_COLORS.blue,
                      borderRadius: 4,
                      barPercentage: 0.6,
                    },
                  ],
                }}
                options={{
                  ...BASE_OPTIONS,
                  plugins: {
                    ...BASE_OPTIONS.plugins,
                    legend: { ...BASE_OPTIONS.plugins.legend, position: "top" as const },
                  },
                  scales: {
                    ...BASE_OPTIONS.scales,
                    y: {
                      ...BASE_OPTIONS.scales.y,
                      max: 100,
                      title: {
                        display: true,
                        text: "Completion Rate %",
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: "#9CA3AF",
                      },
                    },
                  },
                }}
              />
            </div>

            <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
              <table className={styles.effectivenessTable}>
                <thead>
                  <tr>
                    <th>Manager</th>
                    <th>Team Size</th>
                    <th>Goals Managed</th>
                    <th>Approval Rate</th>
                    <th>Check-In Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.managerEffectiveness.map((mgr) => (
                    <tr key={mgr.managerId}>
                      <td>
                        <div className={styles.managerRow}>
                          <div className={styles.managerAvatar}>
                            {mgr.managerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className={styles.managerName}>{mgr.managerName}</div>
                            <div className={styles.managerTeamSize}>{mgr.teamSize} direct reports</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{mgr.teamSize}</td>
                      <td>{mgr.totalGoals}</td>
                      <td>
                        <div className={styles.rateBar}>
                          <div
                            className={`${styles.rateBarFill} ${mgr.approvalRate >= 70 ? styles.rateGood : mgr.approvalRate >= 40 ? styles.rateMedium : styles.rateLow}`}
                            style={{ width: `${mgr.approvalRate}%` }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{mgr.approvalRate}%</span>
                      </td>
                      <td>
                        <div className={styles.rateBar}>
                          <div
                            className={`${styles.rateBarFill} ${mgr.checkinRate >= 70 ? styles.rateGood : mgr.checkinRate >= 40 ? styles.rateMedium : styles.rateLow}`}
                            style={{ width: `${mgr.checkinRate}%` }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{mgr.checkinRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className={styles.emptyChart}>
            <Activity size={28} />
            <span>No manager data available for effectiveness analysis.</span>
          </div>
        )}
      </div>
    </>
  );
}
