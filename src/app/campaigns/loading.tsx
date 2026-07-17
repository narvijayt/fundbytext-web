import PageSplash from "@/components/PageSplash";

// Shown while the browse page runs its campaign query, so opening it — or paging
// / switching a filter — never looks like a dead click.
export default function Loading() {
    return <PageSplash message="Loading Campaigns…" />;
}
