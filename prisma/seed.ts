import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4gvN6HyXPshr@ep-rough-grass-apy8hjyb.c-7.us-east-1.aws.neon.tech/neondb?sslmode=verify-full";

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log("Cleaned existing data");

  // Create Departments
  const engineering = await prisma.department.create({ data: { name: "Engineering" } });
  const sales = await prisma.department.create({ data: { name: "Sales" } });
  const operations = await prisma.department.create({ data: { name: "Operations" } });

  console.log("Created departments");

  // Hash passwords
  const adminPass = await bcrypt.hash("admin123", 10);
  const managerPass = await bcrypt.hash("manager123", 10);
  const employeePass = await bcrypt.hash("employee123", 10);

  // Create Admin
  await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "admin@atomberg.com",
      password: adminPass,
      role: "ADMIN",
      departmentId: operations.id,
    },
  });

  // Create Managers
  const manager1 = await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      email: "manager@atomberg.com",
      password: managerPass,
      role: "MANAGER",
      departmentId: engineering.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Anita Desai",
      email: "manager2@atomberg.com",
      password: managerPass,
      role: "MANAGER",
      departmentId: sales.id,
    },
  });

  // Create Employees under Manager 1 (Engineering)
  const emp1 = await prisma.user.create({
    data: {
      name: "Arjun Patel",
      email: "employee@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name: "Sneha Reddy",
      email: "sneha@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "vikram@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  // Create Employees under Manager 2 (Sales)
  const emp4 = await prisma.user.create({
    data: {
      name: "Meera Joshi",
      email: "meera@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: sales.id,
      managerId: manager2.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Rohan Gupta",
      email: "rohan@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: sales.id,
      managerId: manager2.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Kavita Nair",
      email: "kavita@atomberg.com",
      password: employeePass,
      role: "EMPLOYEE",
      departmentId: operations.id,
      managerId: manager2.id,
    },
  });

  console.log("Created users");

  // Create Goal Cycle
  const cycle = await prisma.goalCycle.create({
    data: {
      name: "FY 2025-26",
      startDate: new Date("2025-05-01"),
      endDate: new Date("2026-04-30"),
      phase: "GOAL_SETTING",
      isActive: true,
    },
  });

  console.log("Created goal cycle");

  // Create sample goals for Employee 1 (Arjun Patel)
  await prisma.goal.createMany({
    data: [
      {
        title: "Reduce Fan Assembly TAT to 2 Days",
        description: "Optimize the ceiling fan assembly line to achieve a turnaround time of 2 days or less",
        thrustArea: "Operational Excellence",
        uom: "NUMERIC_MAX",
        target: 2,
        weightage: 25,
        status: "LOCKED",
        employeeId: emp1.id,
        cycleId: cycle.id,
      },
      {
        title: "Achieve 95% CSAT Score",
        description: "Maintain customer satisfaction above 95% for engineering support tickets",
        thrustArea: "Customer Focus",
        uom: "PERCENTAGE_MIN",
        target: 95,
        weightage: 20,
        status: "LOCKED",
        employeeId: emp1.id,
        cycleId: cycle.id,
      },
      {
        title: "Zero Safety Incidents",
        description: "Ensure zero reportable safety incidents on the production floor",
        thrustArea: "Safety & Compliance",
        uom: "ZERO",
        target: 0,
        weightage: 15,
        status: "LOCKED",
        employeeId: emp1.id,
        cycleId: cycle.id,
      },
      {
        title: "Complete ISO 9001 Audit by March",
        description: "Lead the preparation and successful completion of the ISO 9001 re-certification audit",
        thrustArea: "Quality",
        uom: "TIMELINE",
        targetDate: new Date("2026-03-31"),
        weightage: 20,
        status: "LOCKED",
        employeeId: emp1.id,
        cycleId: cycle.id,
      },
      {
        title: "Reduce BLDC Motor Rejection Rate to 1%",
        description: "Bring down the BLDC motor rejection rate from current 3% to below 1%",
        thrustArea: "Operational Excellence",
        uom: "PERCENTAGE_MAX",
        target: 1,
        weightage: 20,
        status: "LOCKED",
        employeeId: emp1.id,
        cycleId: cycle.id,
      },
    ],
  });

  // Create sample goals for Employee 2 (Sneha) - DRAFT status
  await prisma.goal.createMany({
    data: [
      {
        title: "Increase Revenue by 15%",
        description: "Drive quarter-over-quarter revenue growth through improved product quality",
        thrustArea: "Growth",
        uom: "PERCENTAGE_MIN",
        target: 15,
        weightage: 30,
        status: "DRAFT",
        employeeId: emp2.id,
        cycleId: cycle.id,
      },
      {
        title: "Launch Smart Lock v2 Firmware",
        description: "Complete firmware development and testing for the Smart Lock v2 product line",
        thrustArea: "Innovation",
        uom: "TIMELINE",
        targetDate: new Date("2025-12-31"),
        weightage: 35,
        status: "DRAFT",
        employeeId: emp2.id,
        cycleId: cycle.id,
      },
      {
        title: "Reduce Bug Escape Rate to <2%",
        description: "Improve QA processes to minimize post-release bugs in production firmware",
        thrustArea: "Quality",
        uom: "PERCENTAGE_MAX",
        target: 2,
        weightage: 35,
        status: "DRAFT",
        employeeId: emp2.id,
        cycleId: cycle.id,
      },
    ],
  });

  // Create submitted goals for Employee 4 (Meera) - awaiting manager approval
  await prisma.goal.createMany({
    data: [
      {
        title: "Achieve ₹50L Monthly Sales Target",
        description: "Consistently hit or exceed the monthly sales target for the North region",
        thrustArea: "Revenue",
        uom: "NUMERIC_MIN",
        target: 50,
        weightage: 30,
        status: "SUBMITTED",
        employeeId: emp4.id,
        cycleId: cycle.id,
      },
      {
        title: "Onboard 25 New Retail Partners",
        description: "Expand retail distribution network by adding 25 new authorized partners",
        thrustArea: "Growth",
        uom: "NUMERIC_MIN",
        target: 25,
        weightage: 25,
        status: "SUBMITTED",
        employeeId: emp4.id,
        cycleId: cycle.id,
      },
      {
        title: "Reduce Customer Return Rate to 3%",
        description: "Work with logistics and support to bring down product returns",
        thrustArea: "Customer Focus",
        uom: "PERCENTAGE_MAX",
        target: 3,
        weightage: 20,
        status: "SUBMITTED",
        employeeId: emp4.id,
        cycleId: cycle.id,
      },
      {
        title: "Complete Sales Training Program",
        description: "Finish all modules of the product knowledge certification by Q2",
        thrustArea: "People Development",
        uom: "TIMELINE",
        targetDate: new Date("2025-10-31"),
        weightage: 25,
        status: "SUBMITTED",
        employeeId: emp4.id,
        cycleId: cycle.id,
      },
    ],
  });

  console.log("Created sample goals");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
