import PageSplash from "@/components/PageSplash";

// Shown while the How It Works server component streams in, so opening it from
// the nav isn't a dead click.
export default function Loading() {
    return <PageSplash message="Loading How It Works…" />;
}
