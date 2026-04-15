"use client";

import { useEffect, useRef } from "react";
import * as Ably from "ably";
import { useRouter } from "next/navigation";

export default function AblyDashboardUpdater({ campaignSlug }: { campaignSlug: string }) {
    const router = useRouter();
    const refreshRef = useRef(router.refresh.bind(router));
    useEffect(() => { refreshRef.current = router.refresh.bind(router); }, [router]);

    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
        if (!key) return;

        const client = new Ably.Realtime({ key });
        const donationCh  = client.channels.get(`campaign:${campaignSlug}`);
        const dashboardCh = client.channels.get(`dashboard:campaign:${campaignSlug}`);

        const onDonation = () => {
            refreshRef.current();
            window.dispatchEvent(new CustomEvent("dashboard:donation"));
        };
        const onControls = () => refreshRef.current();
        const onStatus   = () => refreshRef.current();
        donationCh.subscribe("donation",          onDonation).catch(() => {});
        donationCh.subscribe("controls_changed",  onControls).catch(() => {});
        dashboardCh.subscribe("status_changed",   onStatus).catch(() => {});

        return () => {
            donationCh.unsubscribe("donation",         onDonation);
            donationCh.unsubscribe("controls_changed", onControls);
            dashboardCh.unsubscribe("status_changed",  onStatus);
            const state = client.connection.state;
            if (state !== "closed" && state !== "closing" && state !== "failed") {
                try { client.close(); } catch { /* best-effort */ }
            }
        };
    }, [campaignSlug]);

    return null;
}
