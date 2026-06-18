"use client";

import { useEffect, useState } from "react";
import HelpSpreadModal, { SHARE_EVENT } from "./HelpSpreadModal";

/* Headless host for the "Help Spread the Word" modal. Any share affordance on
   the page (or in the donate/thank-you flow) opens it by dispatching SHARE_EVENT. */
export default function ShareModalHost({
    slug, campaignName, heroUrl, accent,
}: {
    slug: string;
    campaignName: string;
    heroUrl: string | null;
    accent: string;
}) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener(SHARE_EVENT, handler);
        return () => window.removeEventListener(SHARE_EVENT, handler);
    }, []);

    return <HelpSpreadModal isOpen={open} onClose={() => setOpen(false)} slug={slug} campaignName={campaignName} heroUrl={heroUrl} accent={accent} />;
}
