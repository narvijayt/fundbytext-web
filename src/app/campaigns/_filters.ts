/**
 * Client-safe browse constants.
 *
 * These live apart from `_data.ts` on purpose: that module imports prisma, so a
 * "use client" component importing a VALUE from it (the tabs need FILTERS) drags
 * the Prisma client into the browser bundle and the route 500s. Types alone are
 * erased at compile time and would have been fine, but values are not — so keep
 * anything the client touches here, and keep `_data.ts` for the query.
 */

// Six per page, matching the dashboard grid.
export const PAGE_SIZE = 6;

export type FilterKey = "all" | "active" | "upcoming" | "completed";

export const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",       label: "All Campaigns" },
    { key: "active",    label: "Active"         },
    { key: "upcoming",  label: "Upcoming"       },
    { key: "completed", label: "Completed"      },
];
