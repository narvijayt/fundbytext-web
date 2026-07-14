"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DONATE_EVENT } from "./DonateNavButton";
import DonateModal, { type ModalParticipant } from "./DonateModal";
import type { ParticipantRow } from "../page";
import type { DonorPrefill } from "./CampaignDonateShell";

/* ── DonateModalHost ───────────────────────────────────────────────────────
   Headless host for the donate modal. Listens for DONATE_EVENT (fired by the
   nav, the Donate Now button, and each leaderboard participant), opens the
   modal with the right participant pre-selected, auto-opens for ?donor= invite
   links, and mirrors the live donations-paused toggle. Ported from the modal
   half of CampaignDonateShell so the donate flow itself is unchanged. */
type Props = {
    totalRaised:              number;
    goalAmount:               number | null;
    accent:                   string;
    participants:             ParticipantRow[];
    campaignSlug:             string;
    campaignName:             string;
    campaignStory:            string | null;
    heroUrl:                  string | null;
    patternImage:             string | null;
    patternSize:              string;
    patternCover:             boolean;
    defaultTargetMemberId?:   string | null;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    status:                   string;
    isFixedGoal:              boolean;
    donorPrefill?:            DonorPrefill | null;
    daysLeft?:                number | null;
};

export default function DonateModalHost({
    totalRaised, goalAmount, accent, participants,
    campaignSlug, campaignName, campaignStory, heroUrl,
    patternImage, patternSize, patternCover,
    defaultTargetMemberId, donationsEnabled, donationsDisabledMessage,
    status, isFixedGoal, donorPrefill, daysLeft = null,
}: Props) {
    const router = useRouter();
    const [modalOpen,          setModalOpen]          = useState(false);
    const [targetMember,       setTargetMember]       = useState<string | null>(null);
    const [activeDonorPrefill, setActiveDonorPrefill] = useState<DonorPrefill | null>(donorPrefill ?? null);

    // Live donations toggle — an Ably "controls_changed" event (re-dispatched by
    // CampaignUpdater) overrides the server prop without a refresh. Derived, not
    // synced via an effect, so prop refreshes stay authoritative until the next event.
    const [override, setOverride] = useState<{ enabled: boolean; msg: string | null } | null>(null);
    const enabled = override ? override.enabled : donationsEnabled;
    const disabledMsg = override ? override.msg : donationsDisabledMessage;
    useEffect(() => {
        const handler = (e: Event) => {
            const d = (e as CustomEvent<{ donationsEnabled: boolean; donationsDisabledMessage: string | null }>).detail;
            setOverride({ enabled: d.donationsEnabled, msg: d.donationsDisabledMessage });
        };
        window.addEventListener("campaign:donations_toggle", handler);
        return () => window.removeEventListener("campaign:donations_toggle", handler);
    }, []);

    const maxDonationCents = (isFixedGoal && goalAmount !== null)
        ? Math.max(0, Math.round((goalAmount - totalRaised) * 100))
        : null;
    const goalFullyFunded = isFixedGoal && maxDonationCents === 0;

    // Why donations aren't possible right now (if at all). When set, the modal opens
    // to this message instead of the form — otherwise clicking Donate on an ended or
    // fully-funded campaign would silently open nothing (or wrongly show the form).
    const closed =
        status === "completed" ? { title: "Campaign ended",     message: "This campaign has wrapped up and is no longer accepting donations. Thank you for the support!" }
        : status === "upcoming" ? { title: "Not open yet",       message: "Donations open once this campaign starts — check back soon!" }
        : goalFullyFunded       ? { title: "Goal fully funded!", message: "This campaign has reached its goal. Thank you to everyone who gave!" }
        : !enabled              ? { title: "Donations paused",   message: disabledMsg?.trim() || "This campaign is temporarily not accepting donations. Please check back soon." }
        : null;

    const modalParticipants: ModalParticipant[] = participants.map((p) => ({
        id:                p.id,
        first_name:        p.first_name,
        last_name:         p.last_name,
        profile_photo_url: p.profile_photo_url,
    }));

    const isDonorInvite = !!donorPrefill;

    // Open on DONATE_EVENT (nav / Donate Now / leaderboard participant). Always opens
    // the modal — when donations aren't possible it shows the `closed` message instead
    // of the form, so the button never appears to do nothing.
    useEffect(() => {
        const handler = (e: Event) => {
            const memberId = (e as CustomEvent<{ memberId: string | null }>).detail.memberId;
            setActiveDonorPrefill(donorPrefill ? { ...donorPrefill, donorId: null } : null);
            setTargetMember(memberId);
            setModalOpen(true);
        };
        window.addEventListener(DONATE_EVENT, handler);
        return () => window.removeEventListener(DONATE_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-open for a donor invite link — pre-select the assigned participant.
    useEffect(() => {
        if (isDonorInvite && status !== "upcoming" && status !== "completed" && !goalFullyFunded) {
            if (defaultTargetMemberId) setTargetMember(defaultTargetMemberId);
            setActiveDonorPrefill(donorPrefill ?? null);
            setModalOpen(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DonateModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onDonationSuccess={() => router.refresh()}
            campaignSlug={campaignSlug}
            campaignName={campaignName}
            campaignStory={campaignStory}
            heroUrl={heroUrl}
            accent={accent}
            patternImage={patternImage}
            patternSize={patternSize}
            patternCover={patternCover}
            participants={modalParticipants}
            targetMemberId={targetMember}
            donationsEnabled={!closed}
            donationsDisabledMessage={closed?.message ?? null}
            closedTitle={closed?.title}
            maxDonationCents={maxDonationCents}
            donorPrefill={activeDonorPrefill}
            daysLeft={daysLeft}
        />
    );
}
