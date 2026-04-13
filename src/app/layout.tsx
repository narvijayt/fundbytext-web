import type { Metadata } from "next";
import "./globals.css";
import GlobalEffects from "./_components/GlobalEffects";

export const metadata: Metadata = {
    title: "FundByText",
    description: "Fundraising platform powered by text",
};

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
