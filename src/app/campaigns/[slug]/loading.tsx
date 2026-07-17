import PageSplash from "@/components/PageSplash";

// Shown while a public campaign page loads its campaign, members and donations.
// The create/ and edit/ child routes keep their own campaign-wizard splash.
export default function Loading() {
    return <PageSplash message="Loading campaign…" />;
}
