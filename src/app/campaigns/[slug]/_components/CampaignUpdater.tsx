"use client";

import { useEffect, useRef } from "react";
import * as Ably from "ably";
import { useRouter } from "next/navigation";
import type { ControlsChangedPayload } from "@/lib/ably";

type Props = {
    campaignSlug: string;
    status: string;
};

export default function CampaignUpdater({ campaignSlug, status }: Props) {
    const router = useRouter();
    const refreshRef = useRef(router.refresh.bind(router));
    useEffect(() => { refreshRef.current = router.refresh.bind(router); }, [router]);

    // ── Ably: live donation + controls + status updates ───────────────────────
    // campaign:{slug}           → "donation" (active), "controls_changed" (all live statuses)
    // dashboard:campaign:{slug} → "status_changed" (draft/upcoming/active: catches launch + cron transitions)
    useEffect(() => {
        if (status !== "draft" && status !== "active" && status !== "upcoming" && status !== "completed") return;
        const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
        if (!key) return;

        let jitterTimeout: ReturnType<typeof setTimeout> | null = null;

        const client  = new Ably.Realtime({ key });
        const channel = client.channels.get(`campaign:${campaignSlug}`);
        const dashCh  = client.channels.get(`dashboard:campaign:${campaignSlug}`);

        const onDonation = () => refreshRef.current();
        const onStatus   = () => refreshRef.current();

        const onControls = (msg: Ably.Message) => {
            const payload = msg.data as ControlsChangedPayload | undefined;

            if (payload?.change === "donations") {
                // Update UI client-side — no server round-trip, scales to any audience size
                window.dispatchEvent(new CustomEvent("campaign:donations_toggle", {
                    detail: {
                        donationsEnabled:         payload.donations_enabled,
                        donationsDisabledMessage: payload.donations_disabled_message,
                    },
                }));
                return;
            }

            // Visibility change (or unknown): refresh with jitter to avoid thundering herd
            jitterTimeout = setTimeout(() => refreshRef.current(), Math.random() * 5_000);
        };

        if (status === "active") channel.subscribe("donation", onDonation);
        // controls_changed: visibility/donations toggle — only meaningful on live campaigns
        if (status !== "draft") channel.subscribe("controls_changed", onControls);
        // status_changed: launch (draft→active/upcoming) and cron (upcoming→active)
        if (status === "draft" || status === "upcoming" || status === "active") {
            dashCh.subscribe("status_changed", onStatus);
        }

        return () => {
            if (jitterTimeout) clearTimeout(jitterTimeout);
            if (status === "active") channel.unsubscribe("donation", onDonation);
            if (status !== "draft") channel.unsubscribe("controls_changed", onControls);
            if (status === "draft" || status === "upcoming" || status === "active") {
                dashCh.unsubscribe("status_changed", onStatus);
            }
            try { client.close(); } catch { /* best-effort cleanup */ }
        };
    }, [campaignSlug, status]);

    // ── Polling: catches all server-side changes ───────────────────────────────
    // draft     → poll every 10s  (organizer editing preview — sees changes live)
    // upcoming  → poll every 30s  (waiting for campaign to start)
    // active    → poll every 60s  (catches paused donations, early end, status flip)
    // completed → poll every 60s  (catches reactivation)
    useEffect(() => {
        if (status !== "draft" && status !== "upcoming" && status !== "active" && status !== "completed") return;
        const ms = status === "draft" ? 10_000 : status === "upcoming" ? 30_000 : 60_000;
        const id = setInterval(() => refreshRef.current(), ms);
        return () => clearInterval(id);
    }, [status]);

    return null;
}
