import PageSplash from "@/components/PageSplash";

// The auth flows (login / forgot-password / reset-password) had no loading.tsx of
// their own, so they fell all the way back to the root splash. That covers a cold
// load, but not a move BETWEEN two auth pages — the root segment isn't the one
// changing there, so no boundary fired and "Forgot password?" from the login card
// showed nothing. This sits directly above the three pages, so it's the boundary
// that fires for whichever of them is being loaded.
//
// Generic message on purpose, matching the root splash: the FundbyText wordmark is
// already right above it, and one boundary serves all three pages.
//
// Note this only shows when there's actually something to wait for. These pages are
// client components with no data fetching, so a prefetched link between them renders
// instantly and correctly skips the splash rather than flashing it.
export default function Loading() {
    return <PageSplash />;
}
