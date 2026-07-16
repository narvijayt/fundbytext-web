import PageSplash from "@/components/PageSplash";

// Shown while the contact page streams in, so opening it isn't a dead click.
export default function Loading() {
    return <PageSplash message="Loading Contact…" />;
}
