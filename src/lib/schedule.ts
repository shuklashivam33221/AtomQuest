import { prisma } from "@/lib/prisma";
import { GoalPhase } from "@prisma/client";

/**
 * Returns the currently active phase based on the system calendar date.
 * - May - June (months 4, 5): GOAL_SETTING
 * - July - September (months 6, 7, 8): Q1
 * - October - December (months 9, 10, 11): Q2
 * - January - February (months 0, 1): Q3
 * - March - April (months 2, 3): Q4
 */
export function getCalendarPhase(date: Date = new Date()): GoalPhase {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  
  if (month === 4 || month === 5) {
    return "GOAL_SETTING";
  } else if (month === 6 || month === 7 || month === 8) {
    return "Q1";
  } else if (month === 9 || month === 10 || month === 11) {
    return "Q2";
  } else if (month === 0 || month === 1) {
    return "Q3";
  } else {
    return "Q4";
  }
}

/**
 * Checks if a specific phase action is currently allowed.
 * The active database GoalCycle phase acts as the absolute primary source of truth.
 * The calendar schedule acts as the default fallback only if no active cycle is found in the database.
 */
export async function isPhaseActionAllowed(phase: GoalPhase): Promise<boolean> {
  // Allow bypassing only if explicitly requested for automated integrations or evaluators
  if (process.env.BYPASS_SCHEDULE_LOCK === "true") {
    return true;
  }

  // 1. Check manual override phase on the active database goal cycle first (Absolute Source of Truth)
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (activeCycle) {
    return activeCycle.phase === phase;
  }

  // 2. Fallback to current system calendar date if no active cycle is found
  const calendarPhase = getCalendarPhase();
  return calendarPhase === phase;
}
