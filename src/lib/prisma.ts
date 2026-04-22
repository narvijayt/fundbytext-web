import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString, max: 1 });
    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
