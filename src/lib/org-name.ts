import { prisma } from "@/lib/prisma";

/**
 * Is this organization name already owned by someone else?
 *
 * Organizations are one-per-user (`created_by` is unique) and are created on a
 * user's first org-campaign launch. The name itself has no DB constraint, so two
 * people could otherwise both launch as "Green Earth Initiative".
 *
 * Ownership is what matters, not mere existence: a user who already owns the
 * name keeps using it for every new campaign of theirs. So this only reports
 * "taken" when the match belongs to a *different* account.
 *
 * Matching is case- and whitespace-insensitive, so "green earth initiative "
 * can't sit alongside "Green Earth Initiative".
 */
export async function isOrgNameTaken(name: string, userId: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const owner = await prisma.organization.findFirst({
        where:  { name: { equals: trimmed, mode: "insensitive" } },
        select: { created_by: true },
    });

    return Boolean(owner) && owner!.created_by !== userId;
}
