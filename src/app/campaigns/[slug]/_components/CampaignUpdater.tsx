"use client";

import { useEffect, useRef } from "react";
import * as Ably from "ably";
import { useRouter } from "next/navigation";

type Props = {
    campaignSlug: string;
    status:       string;
    endDate:      Date | null;
};

export default function CampaignUpdater({ campaignSlug, status, endDate }: Props) {
    const router = useRouter();
    const refreshRef = useRef(router.refresh.bind(router));
    useEffect(() => { refreshRef.current = router.refresh.bind(router); }, [router]);

    // ── Ably: live donation + controls updates ────────────────────────────────
    // Subscribes to `campaign:{slug}` for all statuses that benefit from live updates.
    // "donation"        → refresh on every new donation (active only, but channel is shared)
    // "controls_changed"→ refresh immediately when visibility/donations_enabled changes
    useEffect(() => {
        if (status !== "active" && status !== "upcoming" && status !== "completed") return;
        const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
        if (!key) return;

        const client  = new Ably.Realtime({ key });
        const channel = client.channels.get(`campaign:${campaignSlug}`);

        const onDonation = () => refreshRef.current();
        const onControls = () => refreshRef.current();

        if (status === "active") channel.subscribe("donation", onDonation);
        channel.subscribe("controls_changed", onControls);

        return () => {
            if (status === "active") channel.unsubscribe("donation", onDonation);
            channel.unsubscribe("controls_changed", onControls);
            const state = client.connection.state;
            if (state !== "closed" && state !== "closing" && state !== "failed") {
                client.close();
            }
        };
    }, [campaignSlug, status]);

    // ── Polling: catches all server-side changes (status, donations_enabled, etc.) ─
    // upcoming  → poll every 30s (waiting for campaign to start)
    // active    → poll every 60s (catches paused donations, early end, status flip)
    // completed → poll every 60s (catches reactivation)
    useEffect(() => {
        if (status !== "upcoming" && status !== "active" && status !== "completed") return;
        const ms = status === "upcoming" ? 30_000 : 60_000;
        const id = setInterval(() => refreshRef.current(), ms);
        return () => clearInterval(id);
    }, [status]);

    return null;
}
