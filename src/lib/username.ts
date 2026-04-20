import { prisma } from "./prisma";

function toSlug(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // strip accents
        .replace(/[^a-z0-9]/g, "");        // keep alphanumeric only
}

// Generates a unique username like "john.smith", "john.smith1", "john.smith2", …
export async function generateUsername(firstName: string, lastName: string): Promise<string> {
    const base = `${toSlug(firstName)}.${toSlug(lastName)}`.slice(0, 28); // leave room for suffix
    const candidate = base || "user";

    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing) return candidate;

    // Find next free suffix
    for (let i = 1; i <= 9999; i++) {
        const withSuffix = `${candidate}${i}`.slice(0, 30);
        const taken = await prisma.user.findUnique({ where: { username: withSuffix }, select: { id: true } });
        if (!taken) return withSuffix;
    }

    // Fallback: timestamp suffix
    return `${candidate}${Date.now()}`.slice(0, 30);
}
