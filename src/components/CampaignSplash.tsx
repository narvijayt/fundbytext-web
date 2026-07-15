import PageSplash from "@/components/PageSplash";

/* ── Campaign-creation splash screen ───────────────────────────────────────
   The campaign wizard's flavour of the shared PageSplash, kept as its own
   component so the create routes' loading.tsx files stay unchanged. */
export default function CampaignSplash() {
    return <PageSplash message="Setting up your campaign…" />;
}
