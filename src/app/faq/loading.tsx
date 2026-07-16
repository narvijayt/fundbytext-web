import PageSplash from "@/components/PageSplash";

// Shown while the FAQ page streams in, so opening it from the footer isn't a
// dead click.
export default function Loading() {
    return <PageSplash message="Loading FAQs…" />;
}
