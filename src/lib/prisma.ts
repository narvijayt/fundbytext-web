import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient() {
    if (!globalForPrisma.pool) {
        globalForPrisma.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 1,
        });
    }
    const adapter = new PrismaPg(globalForPrisma.pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
