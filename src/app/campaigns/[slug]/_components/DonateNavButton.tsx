"use client";

// Fires a custom DOM event that CampaignDonateShell listens to.
// This lets the server-rendered <nav> open the client-side modal
// without needing to lift state all the way into page.tsx.

export const DONATE_EVENT = "fbt:open-donate";

export default function DonateNavButton({ accent }: { accent: string }) {
    return (
        <button
            onClick={() => window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId: null } }))}
            className="px-4 py-2 rounded-full text-white font-bold text-xs sm:text-sm uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
        >
            Donate to this Campaign
        </button>
    );
}
