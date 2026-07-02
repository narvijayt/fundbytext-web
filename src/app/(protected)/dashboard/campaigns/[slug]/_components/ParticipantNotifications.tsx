"use client";

import { useState } from "react";
import NotificationsTable, { type NotificationRow } from "./NotificationsTable";
import NotificationDetailModal from "./NotificationDetailModal";

export type NotifItem = {
    id:            string;
    message:       string | null;
    helper_text:   string | null;
    trigger_event: string | null;
    scheduled_at:  number | null;
    sent_at:       number | null;
    status:        string;
};

type Props = {
    notifications:    NotifItem[];
    totalCount:       number;
    campaignSlug:     string;
    participantName:  string;
    organizerName:    string | null;
    organizationName: string | null;
    senderPhotoUrl:   string | null;
};

/* The participant's "Participant Notifications" — same full-width table as the organizer's
   Campaign Notifications, but each row is clickable and opens a notification
   detail modal (matching the Figma). */
export default function ParticipantNotifications({ notifications, totalCount, campaignSlug, participantName, organizerName, organizationName, senderPhotoUrl }: Props) {
    const [detail, setDetail] = useState<NotificationRow | null>(null);

    return (
        <>
            <NotificationsTable
                title="Participant Notifications"
                notifications={notifications}
                totalCount={totalCount}
                campaignSlug={campaignSlug}
                notifType="participant"
                onRowClick={(n) => setDetail(n)}
            />

            {detail && (
                <NotificationDetailModal
                    notif={detail}
                    participantName={participantName}
                    organizerName={organizerName}
                    organizationName={organizationName}
                    senderPhotoUrl={senderPhotoUrl}
                    onClose={() => setDetail(null)}
                />
            )}
        </>
    );
}
