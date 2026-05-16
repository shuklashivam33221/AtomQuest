export type { 
  User, 
  Goal, 
  Department, 
  GoalCycle, 
  Achievement, 
  CheckIn, 
  AuditLog,
  Role,
  GoalPhase,
  UoMType,
  GoalStatus,
  ProgressStatus
} from "@prisma/client";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  managerId?: string | null;
};
