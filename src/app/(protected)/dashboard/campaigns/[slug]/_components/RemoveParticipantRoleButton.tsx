"use client";

import { useState } from "react";
import RemoveParticipantModal from "./RemoveParticipantModal";

type Props = {
    campaignSlug: string;
    memberId:     string;
    raised:       number;
};

export default function RemoveParticipantRoleButton({ campaignSlug, memberId, raised }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
            >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
                Leave Participant Role
            </button>

            {open && (
                <RemoveParticipantModal
                    memberId={memberId}
                    campaignSlug={campaignSlug}
                    name=""
                    raised={raised}
                    isSelf
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
