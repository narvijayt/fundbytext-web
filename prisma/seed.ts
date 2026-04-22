// prisma/seed.ts
// Run with: npx prisma db seed
// Credentials are read from env vars (see .env):
//   SEED_ADMIN_EMAIL    (default: admin@fundbytext.com)
//   SEED_ADMIN_PASSWORD (default: ChangeMe123!)
//   SEED_ADMIN_FIRST    (default: Admin)
//   SEED_ADMIN_LAST     (default: User)

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL ?? "admin@fundbytext.com";
    const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
    const firstName = process.env.SEED_ADMIN_FIRST ?? "Admin";
    const lastName = process.env.SEED_ADMIN_LAST ?? "User";

    const password_hash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            first_name: firstName,
            last_name: lastName,
            email,
            username: "admin",
            password_hash,
            role: "admin",
            is_email_verified: true,
        },
    });

    console.log(`✓ Admin account ready: ${admin.email} (id: ${admin.id})`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
