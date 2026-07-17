import type { Metadata } from "next";

// Client page — metadata lives here. Noindex: it's a utility flow, not a landing page.
export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Reset the password for your FundByText account.",
    robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return children;
}
