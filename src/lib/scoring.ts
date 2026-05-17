import { UoMType } from "@prisma/client";

/**
 * Computes the progress score for a given achievement against its target,
 * based on the Unit of Measurement (UoM) type formula specified in the BRD.
 * 
 * Returns a percentage value between 0 and 100 (or higher if over-achieved).
 */
export function computeProgressScore(
  uom: UoMType,
  target: number | null,
  actualValue: number | null,
  progressStatus: string
): number {
  if (actualValue === null && progressStatus !== "COMPLETED") return 0;

  // Provide a safe fallback if actualValue is null but marked as completed
  const actual = actualValue ?? 0;

  switch (uom) {
    case "NUMERIC_MIN":
    case "PERCENTAGE_MIN":
      // Higher is better: Achievement ÷ Target
      if (!target || target === 0) return 0;
      return Math.max(0, (actual / target) * 100);

    case "NUMERIC_MAX":
    case "PERCENTAGE_MAX":
      // Lower is better: Target ÷ Achievement
      if (!target) return 0;
      if (actual <= 0) return 100; // Perfect score if actual is 0 or less (e.g., 0 TAT)
      return Math.max(0, Math.min(100, (target / actual) * 100)); // Cap at 100%

    case "ZERO":
      // Zero = Success
      return actual === 0 ? 100 : 0;

    case "TIMELINE":
      // Timeline: Date-based completion. 
      // If the employee manually marked it as COMPLETED, they get 100%.
      // In a real system, this would compare completionDate against targetDate.
      if (progressStatus === "COMPLETED") return 100;
      // If it's a numeric proxy for timeline (e.g., % complete towards milestone)
      if (target && target > 0 && actual > 0) return Math.min(100, (actual / target) * 100);
      return 0;

    default:
      return 0;
  }
}

/**
 * Formats a score for display (e.g., 85.5% -> "86%")
 */
export function formatScore(score: number): string {
  if (isNaN(score)) return "0%";
  return `${Math.round(score)}%`;
}
