"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Session = {
    id:          string;
    is_mobile:   boolean;
    ip_address:  string | null;
    user_agent:  string | null;
    created_at:  number;
    expires_at:  number | null;
    revoked_at:  number | null;
};

function fmtDateTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " · "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtRelative(ts: number) {
    const diff = Date.now() - ts;
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return "Just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return fmtDateTime(ts);
}

function parseBrowser(ua: string | null): string {
    if (!ua) return "Unknown";
    if (ua.includes("Edg/"))     return "Edge";
    if (ua.includes("Chrome/"))  return "Chrome";
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
    return "Browser";
}

function isMobileBrowserUA(ua: string | null): boolean {
    if (!ua) return false;
    return /Mobile|Android|iPhone|iPad/.test(ua);
}

function sessionStatus(s: Session): "active" | "expired" | "revoked" {
    if (s.revoked_at !== null) return "revoked";
    if (s.expires_at !== null && s.expires_at < Date.now()) return "expired";
    return "active";
}

const STATUS_STYLES = {
    active:  "bg-green-50 text-green-700 border-green-100",
    expired: "bg-gray-100 text-gray-500 border-gray-200",
    revoked: "bg-red-50 text-red-600 border-red-100",
};

export default function UserSessionsSection({
    userId,
    sessions: initialSessions,
    totalSessions,
    currentPage,
    totalPages,
    prevHref,
    nextHref,
    sessionFilter,
    filterHrefs,
}: {
    userId:        string;
    sessions:      Session[];
    totalSessions: number;
    currentPage:   number;
    totalPages:    number;
    prevHref:      string | null;
    nextHref:      string | null;
    sessionFilter: string;
    filterHrefs:   { all: string; active: string; revoked: string; expired: string };
}) {
    const router = useRouter();
    const [sessions,    setSessions]    = useState(initialSessions);
    const [revoking,    setRevoking]    = useState<string | null>(null);   // sessionId or "all"
    const [confirming,  setConfirming]  = useState<string | null>(null);   // sessionId or "all"
    const [error,       setError]       = useState("");

    const activeSessions = sessions.filter((s) => sessionStatus(s) === "active");

    async function revokeOne(sessionId: string) {
        setRevoking(sessionId);
        setConfirming(null);
        setError("");
        const res = await fetch(`/api/v1/admin/users/${userId}/sessions/${sessionId}`, { method: "DELETE" });
        if (res.ok) {
            setSessions((prev) =>
                prev.map((s) => s.id === sessionId ? { ...s, revoked_at: Date.now() } : s)
            );
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to revoke session.");
        }
        setRevoking(null);
    }

    async function revokeAll() {
        setRevoking("all");
        setConfirming(null);
        setError("");
        const res = await fetch(`/api/v1/admin/users/${userId}/sessions`, { method: "DELETE" });
        if (res.ok) {
            setSessions((prev) =>
                prev.map((s) => sessionStatus(s) === "active" ? { ...s, revoked_at: Date.now() } : s)
            );
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to revoke sessions.");
        }
        setRevoking(null);
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Sessions</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {activeSessions.length} active · {totalSessions} total
                    </p>
                </div>
                {activeSessions.length > 0 && (
                    confirming === "all" ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Revoke all {activeSessions.length} active sessions?</span>
                            <button
                                onClick={revokeAll}
                                disabled={revoking === "all"}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {revoking === "all" ? "Revoking…" : "Yes, revoke all"}
                            </button>
                            <button
                                onClick={() => setConfirming(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirming("all")}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Revoke All Active
                        </button>
                    )
                )}
            </div>

            {/* Filter tabs */}
            <div className="px-6 py-2.5 border-b border-gray-50 flex items-center gap-1">
                {(["all", "active", "revoked", "expired"] as const).map((f) => (
                    <Link
                        key={f}
                        scroll={false}
                        href={filterHrefs[f]}
                        className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                            sessionFilter === f
                                ? "bg-gray-900 text-white"
                                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        {f}
                    </Link>
                ))}
            </div>

            {error && (
                <div className="px-6 py-2 bg-red-50 border-b border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}

            {sessions.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No sessions found.</p>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-225">
                    <thead>
                        <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-6 py-3">Device</th>
                            <th className="text-left px-6 py-3">IP Address</th>
                            <th className="text-left px-6 py-3">Signed In</th>
                            <th className="text-left px-6 py-3">Expires</th>
                            <th className="text-left px-6 py-3">Status</th>
                            <th className="px-6 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sessions.map((s) => {
                            const status  = sessionStatus(s);
                            const browser = parseBrowser(s.user_agent);
                            const isConfirming = confirming === s.id;
                            return (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {s.is_mobile ? (
                                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-700">
                                                    {s.is_mobile ? "Mobile App" : browser}
                                                </p>
                                                <p className="text-[10px] text-gray-400 max-w-45 truncate" title={s.user_agent ?? undefined}>
                                                    {s.is_mobile
                                                        ? "Native App"
                                                        : isMobileBrowserUA(s.user_agent)
                                                            ? "Mobile Browser"
                                                            : "Desktop Browser"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                                        {s.ip_address ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        <p>{fmtDateTime(s.created_at)}</p>
                                        <p className="text-gray-400">{fmtRelative(s.created_at)}</p>
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                                        {s.expires_at ? fmtDateTime(s.expires_at) : "Never"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status]}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                        {status === "active" && (
                                            isConfirming ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => revokeOne(s.id)}
                                                        disabled={revoking === s.id}
                                                        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                                                    >
                                                        {revoking === s.id ? "…" : "Confirm"}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirming(null)}
                                                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirming(s.id)}
                                                    disabled={revoking === s.id}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {prevHref && (
                            <Link scroll={false} href={prevHref} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Previous
                            </Link>
                        )}
                        {nextHref && (
                            <Link scroll={false} href={nextHref} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
