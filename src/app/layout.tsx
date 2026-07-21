import type { Metadata } from "next";
import "./globals.css";
import GlobalEffects from "./_components/GlobalEffects";

export const metadata: Metadata = {
    // Absolute URLs (Open Graph, canonical) resolve against this. Falls back to the
    // Vercel domain when NEXT_PUBLIC_APP_URL isn't set (e.g. a bare build).
    // Trailing slash stripped for the same reason as lib/app-url: the env value is
    // commonly configured with one. (Keeps its own production fallback — a bare
    // build should not advertise localhost as the canonical origin.)
    metadataBase: new URL((process.env.NEXT_PUBLIC_APP_URL ?? "https://fundbytext-web.vercel.app").replace(/\/+$/, "")),
    // `default` is the home title; every other page sets a short `title` that the
    // template suffixes ("About Us · FundByText").
    title: {
        default: "FundByText — Text-Driven Fundraising Made Simple",
        template: "%s · FundByText",
    },
    description:
        "FundByText is a text-driven fundraising platform. Launch a campaign in minutes, share one link by text, email or social, and let supporters give in a few taps — for individuals and organizations alike.",
    applicationName: "FundByText",
    keywords: [
        "fundraising", "text to give", "online fundraising", "fundraising campaigns",
        "donations", "nonprofit fundraising", "sports team fundraising",
        "church fundraising", "school fundraising", "FundByText",
    ],
    authors: [{ name: "FundByText" }],
    creator: "FundByText",
    publisher: "FundByText",
    openGraph: {
        type: "website",
        siteName: "FundByText",
        title: "FundByText — Text-Driven Fundraising Made Simple",
        description:
            "Launch a fundraising campaign in minutes and let supporters give in a few taps — no account needed.",
        url: "/",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "FundByText — Text-Driven Fundraising Made Simple",
        description: "Launch a fundraising campaign in minutes and let supporters give in a few taps.",
    },
    robots: { index: true, follow: true },
};

export function generateViewport() {
    // The product is designed light-only. colorScheme:"light" emits
    // <meta name="color-scheme" content="light">, which — together with the
    // color-scheme:light in globals.css — tells the browser (incl. mobile) to keep
    // form controls, the canvas and UA styles light even under OS dark mode, so the
    // page looks identical to light mode. No dark: variants exist in the app.
    return { width: "device-width", initialScale: 1, colorScheme: "light" as const };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <body className="min-h-full flex flex-col">
                <GlobalEffects />
                {children}
            </body>
        </html>
    );
}
