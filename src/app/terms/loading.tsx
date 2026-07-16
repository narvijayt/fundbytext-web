import PageSplash from "@/components/PageSplash";

// Shown while the policy page streams in, so opening it from the footer never
// looks like a dead click.
export default function Loading() {
    return <PageSplash message="Loading Terms & Conditions…" />;
}
