// Shared Ably helpers.
// Server-side: publish events via REST (no persistent connection).
// Client-side: use the Realtime client in components.

import Ably from "ably";

let _rest: Ably.Rest | null = null;

function getAblyRest(): Ably.Rest {
    if (!_rest) {
        if (!process.env.ABLY_API_KEY) throw new Error("ABLY_API_KEY is not set");
        _rest = new Ably.Rest(process.env.ABLY_API_KEY);
    }
    return _rest;
}

export type DonationEvent = {
    id:                 string;
    amount:             number;
    donor_display_name: string;
    donor_first_name:   string;
    donor_last_name:    string;
    is_anonymous:       boolean;
    member_id:          string | null;
    created_at:         number;   // ms timestamp
    total_raised:       number;
};

export function campaignChannel(slug: string) {
    return `campaign:${slug}`;
}

export function dashboardChannel(slug: string) {
    return `dashboard:campaign:${slug}`;
}

export async function publishDonation(campaignSlug: string, payload: DonationEvent) {
    try {
        const rest    = getAblyRest();
        const channel = rest.channels.get(campaignChannel(campaignSlug));
        await channel.publish("donation", payload);
    } catch (err) {
        // Non-fatal — log and continue
        console.error("[ably] publishDonation failed:", err);
    }
}

export async function publishStatusChange(campaignSlug: string, status: string) {
    try {
        const rest    = getAblyRest();
        const channel = rest.channels.get(dashboardChannel(campaignSlug));
        await channel.publish("status_changed", { status });
    } catch (err) {
        console.error("[ably] publishStatusChange failed:", err);
    }
}

export async function publishControlsChanged(campaignSlug: string) {
    try {
        const rest    = getAblyRest();
        const channel = rest.channels.get(campaignChannel(campaignSlug));
        await channel.publish("controls_changed", {});
    } catch (err) {
        console.error("[ably] publishControlsChanged failed:", err);
    }
}
