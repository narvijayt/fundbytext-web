import type { Metadata } from "next";

// Client page — metadata lives here. Noindex: a tokenised reset link should never
// be crawled or ranked.
export const metadata: Metadata = {
    title: "Reset Password",
    description: "Choose a new password for your FundByText account.",
    robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
    return children;
}
