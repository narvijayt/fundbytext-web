import { NotificationStatus } from "@/generated/prisma/enums";

function fmtDate(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const NOTIF_STATUS_BADGE: Record<NotificationStatus, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "bg-yellow-100 text-yellow-700" },
    sent:      { label: "Sent",      cls: "bg-green-100 text-green-700"   },
    failed:    { label: "Failed",    cls: "bg-red-100 text-red-700"       },
};

export type NotificationRow = {
    id: string;
    notification_type: string;
    trigger_event: string | null;
    message: string | null;
    helper_text: string | null;
    scheduled_at: Date | null;
    sent_at: Date | null;
    status: string;
    recipient_member_id: string | null;
};

type Props = {
    title: string;
    notifications: NotificationRow[];
};

export default function NotificationsTable({ title, notifications }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {notifications.length}
                </span>
            </div>
            {notifications.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">No {title.toLowerCase()} yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Message</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Helper Text</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Scheduled</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((n) => {
                                const sb = NOTIF_STATUS_BADGE[n.status as NotificationStatus];
                                return (
                                    <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3.5 max-w-xs">
                                            <p className="truncate text-gray-700">{n.message}</p>
                                            <p className="text-xs text-gray-400">{n.trigger_event}</p>
                                        </td>
                                        <td className="px-6 py-3.5 text-gray-500 max-w-xs">
                                            <p className="truncate">{n.helper_text ?? "—"}</p>
                                        </td>
                                        <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                                            {n.scheduled_at
                                                ? <>
                                                    <p>{fmtDate(n.scheduled_at)}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {n.scheduled_at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                    </p>
                                                  </>
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sb.cls}`}>{sb.label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
