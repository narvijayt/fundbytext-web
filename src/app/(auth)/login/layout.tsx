import type { Metadata } from "next";

// The page itself is a client component, so its <title>/robots tags live here in a
// co-located layout. Auth utility pages are noindex — there's nothing to rank.
export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your FundByText account to manage your campaigns, participants, and donations.",
    robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
