import PageSplash from "@/components/PageSplash";

// Shown while the About server component streams in, so opening About from
// anywhere in the app gives immediate feedback instead of a dead click.
export default function Loading() {
    return <PageSplash message="Loading About Us…" />;
}
