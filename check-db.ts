import { prisma } from "./src/lib/prisma";
prisma.user.findMany().then((u: any) => console.log('USERS IN DB:', u.length)).catch(console.error).finally(() => prisma.$disconnect());
