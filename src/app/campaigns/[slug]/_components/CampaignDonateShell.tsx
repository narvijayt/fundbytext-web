"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DONATE_EVENT } from "./DonateNavButton";
import DonateModal, { type ModalParticipant } from "./DonateModal";
import ProgressPanel from "./ProgressPanel";
import InlineDonateForm from "./InlineDonateForm";
import type { RecentDonation, ParticipantRow } from "../page";

export type DonorPrefill = {
    donorId:   string;   // CampaignDonor.id — used to link payment back to the exact donor record
    firstName: string;
    lastName:  string;
    email:     string;
};

type Props = {
    totalRaised:        number;
    goalAmount:         number | null;
    initialGoalAmount:  number | null;
    pct:                number;
    daysLeft:        number | null;
    donorCount:      number;
    recentDonations: RecentDonation[];
    accent:          string;
    participants:    ParticipantRow[];
    campaignSlug:    string;
    campaignName:           string;
    campaignStory:          string | null;
    heroUrl:                string | null;
    defaultTargetMemberId?:   string | null;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    endDate:                  Date | null;
    startDate:                Date | null;
    status:                   string;
    donorPrefill?:            DonorPrefill | null;
};

export default function CampaignDonateShell({
    totalRaised,
    goalAmount,
    initialGoalAmount,
    pct,
    daysLeft,
    donorCount,
    recentDonations,
    accent,
    participants,
    campaignSlug,
    campaignName,
    campaignStory,
    heroUrl,
    defaultTargetMemberId,
    donationsEnabled,
    donationsDisabledMessage,
    endDate,
    startDate,
    status,
    donorPrefill,
}: Props) {
    const router = useRouter();
    const [modalOpen,    setModalOpen]    = useState(false);
    const [targetMember, setTargetMember] = useState<string | null>(null);
    const [extraRaised,  setExtraRaised]  = useState(0);
    const [extraDonors,  setExtraDonors]  = useState(0);

    // When server data refreshes (totalRaised prop changes), the new donation is
    // already included — clear the optimistic delta to avoid double-counting.
    const prevTotalRaisedRef = useRef(totalRaised);
    useEffect(() => {
        if (totalRaised !== prevTotalRaisedRef.current) {
            prevTotalRaisedRef.current = totalRaised;
            setExtraRaised(0);
            setExtraDonors(0);
        }
    }, [totalRaised]);

    // ModalParticipant shape is a subset of ParticipantRow
    const modalParticipants: ModalParticipant[] = participants.map((p) => ({
        id:                p.id,
        first_name:        p.first_name,
        last_name:         p.last_name,
        profile_photo_url: p.profile_photo_url,
    }));

    // ?ref= only (participant shared their own link) → inline form, participant pre-selected.
    // ?donor= present (organizer-added donor invite, may also carry ?ref=) → always modal path,
    // auto-open with prefill + pre-select the assigned participant.
    const isDonorInvite        = !!donorPrefill;
    const isParticipantRefLink = !!defaultTargetMemberId && !isDonorInvite;

    const resolvedTarget = defaultTargetMemberId
        ? (modalParticipants.find((p) => p.id === defaultTargetMemberId) ?? null)
        : null;

    // Listen for the event fired by DonateNavButton (lives inside the server <nav>)
    useEffect(() => {
        const handler = (e: Event) => {
            const memberId = (e as CustomEvent<{ memberId: string | null }>).detail.memberId;
            setTargetMember(memberId);
            setModalOpen(true);
        };
        window.addEventListener(DONATE_EVENT, handler);
        return () => window.removeEventListener(DONATE_EVENT, handler);
    }, []);

    // Auto-open modal for donor invite links — pre-select the assigned participant
    // Do not open if campaign is upcoming (donations not yet open)
    useEffect(() => {
        if (isDonorInvite && status !== "upcoming" && status !== "completed") {
            if (defaultTargetMemberId) setTargetMember(defaultTargetMemberId);
            setModalOpen(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isParticipantRefLink && status !== "completed") {
        return (
            <InlineDonateForm
                totalRaised={totalRaised}
                goalAmount={goalAmount}
                pct={pct}
                daysLeft={daysLeft}
                donorCount={donorCount}
                campaignSlug={campaignSlug}
                accent={accent}
                targetMember={resolvedTarget}
                donorPrefill={donorPrefill ?? null}
                donationsEnabled={donationsEnabled}
                donationsDisabledMessage={donationsDisabledMessage}
                onDonationSuccess={() => router.refresh()}
            />
        );
    }

    return (
        <>
            {/* Right sidebar */}
            <ProgressPanel
                totalRaised={totalRaised + extraRaised}
                goalAmount={goalAmount}
                initialGoalAmount={initialGoalAmount}
                pct={goalAmount ? Math.min(100, ((totalRaised + extraRaised) / goalAmount) * 100) : pct}
                donorCount={donorCount + extraDonors}
                recentDonations={recentDonations}
                accent={accent}
                donationsEnabled={donationsEnabled}
                donationsDisabledMessage={donationsDisabledMessage}
                endDate={endDate}
                startDate={startDate}
                status={status}
                onDonate={() => { setTargetMember(null); setModalOpen(true); }}
            />

            {/* Donate modal */}
            <DonateModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onDonationSuccess={(amt) => {
                    setModalOpen(false);
                    setExtraRaised((r) => r + amt);
                    setExtraDonors((d) => d + 1);
                    router.refresh();
                }}
                campaignSlug={campaignSlug}
                campaignName={campaignName}
                campaignStory={campaignStory}
                heroUrl={heroUrl}
                accent={accent}
                participants={modalParticipants}
                targetMemberId={targetMember}
                donationsEnabled={donationsEnabled}
                donationsDisabledMessage={donationsDisabledMessage}
                donorPrefill={donorPrefill ?? null}
            />
        </>
    );
}
