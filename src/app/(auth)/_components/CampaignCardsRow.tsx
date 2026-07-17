"use client";

import { useEffect, useState } from "react";
import HeroCampaignsCarousel, { type HeroCard } from "@/components/home/HeroCampaignsCarousel";

/**
 * The login page's campaign row — the SAME featured-centre carousel as the
 * marketing home hero (drag to move, snaps card-to-card, no scrollbar, "Browse
 * all" link at the end). It shows real ACTIVE campaigns, fetched from
 * /api/v1/campaigns/featured (the login page is a client component, so it can't
 * read the DB directly). Renders nothing until the fetch resolves and nothing when
 * there are no active campaigns — no dummy placeholders.
 */
export default function CampaignCardsRow() {
    const [cards, setCards] = useState<HeroCard[] | null>(null);

    useEffect(() => {
        let alive = true;
        fetch("/api/v1/campaigns/featured")
            .then((r) => r.json())
            .then((d) => { if (alive) setCards(Array.isArray(d?.cards) ? d.cards : []); })
            .catch(() => { if (alive) setCards([]); });
        return () => { alive = false; };
    }, []);

    if (!cards || cards.length === 0) return null;
    return <HeroCampaignsCarousel cards={cards} browseHref="/campaigns" />;
}
