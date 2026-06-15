import type { Metadata } from "next";
import HeroSection from "./_components/HeroSection";
import CampaignDetails from "./_components/CampaignDetails";
import Shareables from "./_components/Shareables";
import LeaderboardSection from "./_components/LeaderboardSection";
import MarketingFooter from "./_components/MarketingFooter";

export const metadata: Metadata = {
    title: "New Helmets for the Bears Football Team — FundbyText",
    description: "Help our team get new uniforms and travel costs. Every little bit counts!",
};

/* ── Single-campaign marketing page (/campaign/[slug]) ──────────────────
   Static implementation of the "Single Campaign Complete" Figma design.
   Lives alongside (and does not touch) the functional /campaigns/[slug]. */
export default async function CampaignMarketingPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    await params; // slug currently unused — page renders the static design

    return (
        <div className="min-h-screen bg-[#f9f9fc] font-sans">
            <HeroSection />
            <CampaignDetails />
            <Shareables />
            <LeaderboardSection />
            <MarketingFooter />
        </div>
    );
}
