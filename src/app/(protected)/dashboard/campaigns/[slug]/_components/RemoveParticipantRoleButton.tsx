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
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 17l5-5-5-5M21 12H9M12 21H6a2 2 0 01-2-2V5a2 2 0 012-2h6" />
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
