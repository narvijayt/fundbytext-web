import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import SuspendUserButton    from "./_components/SuspendUserButton";
import DeleteUserButton     from "./_components/DeleteUserButton";
import EditUserButton       from "./_components/EditUserButton";
import UserSessionsSection  from "./_components/UserSessionsSection";
import UserCampaignFilters  from "./_components/UserCampaignFilters";

const CAMPAIGNS_PER_PAGE = 5;
const SESSIONS_PER_PAGE  = 5;

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Ctx = {
    params:       Promise<{ id: string }>;
    searchParams: Promise<{ cp?: string; sp?: string; cq?: string; cf?: string; csort?: string; sf?: string }>;
};

export default async function AdminUserDetailPage({ params, searchParams }: Ctx) {
    const { id }  = await params;
    const sp      = await searchParams;
    const currentAdmin = await getAuthUser();
    const cp      = Math.max(1, parseInt(sp.cp    ?? "1") || 1);
    const sPage   = Math.max(1, parseInt(sp.sp    ?? "1") || 1);
    const cq      = typeof sp.cq    === "string" ? sp.cq.trim() : "";
    const cf      = typeof sp.cf    === "string" ? sp.cf        : "all";
    const csort   = typeof sp.csort === "string" ? sp.csort     : "newest";
    const sf      = typeof sp.sf    === "string" ? sp.sf        : "all";

    // ── Campaign filter where clause ──
    const campaignRelation: Record<string, unknown> = {};
    if (cq) campaignRelation.name = { contains: cq, mode: "insensitive" };
    if (["active", "upcoming", "draft", "completed"].includes(cf)) campaignRelation.status = cf;
    const memberWhere: Record<string, unknown> = { user_id: id };
    if (Object.keys(campaignRelation).length > 0) memberWhere.campaign = campaignRelation;
    if (cf === "organizer" || cf === "participant") memberWhere.roles = { some: { role: cf } };

    const campaignOrderBy =
        csort === "oldest"     ? { campaign: { created_at: "asc"        as const } }
        : csort === "most_raised" ? { campaign: { total_raised: "desc"  as const } }
        : { campaign: { created_at: "desc" as const } };

    // ── Session filter where clause ──
    const now = new Date();
    const sessionWhere: Record<string, unknown> = { user_id: id };
    if (sf === "active")  { sessionWhere.revoked_at = null; sessionWhere.OR = [{ expires_at: null }, { expires_at: { gt: now } }]; }
    if (sf === "revoked") { sessionWhere.revoked_at = { not: null }; }
    if (sf === "expired") { sessionWhere.revoked_at = null; sessionWhere.expires_at = { lt: now }; }

    const [
        user,
        campaignTotal,
        memberships,
        totalRaisedResult,
        sessionTotal,
        sessions,
        firstMembership,
        organization,
    ] = await Promise.all([
        prisma.user.findUnique({
            where: { id },
            select: {
                id:                 true,
                first_name:         true,
                last_name:          true,
                email:              true,
                username:           true,
                phone:              true,
                role:               true,
                is_suspended:       true,
                suspension_message: true,
                deleted_at:         true,
                deleted_email:      true,
                is_email_verified:  true,
                created_at:         true,
                profile_photo_url:  true,
            },
        }),
        // unfiltered total for the stats card
        prisma.campaignMember.count({ where: { user_id: id } }),
        prisma.campaignMember.findMany({
            where:   memberWhere,
            select: {
                roles: { select: { role: true } },
                campaign: {
                    select: {
                        slug:          true,
                        name:          true,
                        status:        true,
                        campaign_type: true,
                        total_raised:  true,
                        media: {
                            where:  { media_type: "hero" },
                            take:   1,
                            select: { url: true },
                        },
                    },
                },
            },
            orderBy: campaignOrderBy,
            skip:    (cp - 1) * CAMPAIGNS_PER_PAGE,
            take:    CAMPAIGNS_PER_PAGE,
        }),
        prisma.campaign.aggregate({
            where: { members: { some: { user_id: id } } },
            _sum:  { total_raised: true },
        }),
        // unfiltered total for the sessions header
        prisma.userSession.count({ where: { user_id: id } }),
        prisma.userSession.findMany({
            where:   sessionWhere,
            orderBy: { created_at: "desc" },
            skip:    (sPage - 1) * SESSIONS_PER_PAGE,
            take:    SESSIONS_PER_PAGE,
            select: {
                id:         true,
                is_mobile:  true,
                ip_address: true,
                user_agent: true,
                created_at: true,
                expires_at: true,
                revoked_at: true,
            },
        }),
        prisma.campaignMember.findFirst({
            where:   { user_id: id },
            orderBy: { created_at: "asc" },
            select: {
                invite_token: true,
                roles:    { select: { role: true } },
                campaign: { select: { name: true, slug: true } },
            },
        }),
        prisma.organization.findUnique({
            where:  { created_by: id },
            select: { id: true, name: true },
        }),
    ]);

    // filtered totals for pagination
    const [filteredCampaignTotal, filteredSessionTotal] = await Promise.all([
        prisma.campaignMember.count({ where: memberWhere }),
        prisma.userSession.count({ where: sessionWhere }),
    ]);

    if (!user) notFound();

    // Determine how this account was created
    const createdVia = !firstMembership
        ? "admin" as const
        : firstMembership.invite_token
            ? "participant" as const
            : "self" as const;
    const createdViaCampaign = firstMembership?.campaign ?? null;

    const campaigns  = memberships.map((m) => ({ ...m.campaign, roles: m.roles.map((r) => r.role) }));
    const totalRaised = parseFloat((totalRaisedResult._sum.total_raised ?? 0).toString());

    const campaignTotalPages = Math.ceil(filteredCampaignTotal / CAMPAIGNS_PER_PAGE);
    const sessionTotalPages  = Math.ceil(filteredSessionTotal  / SESSIONS_PER_PAGE);

    // URL builder — preserves all active params
    function buildUrl(overrides: { cp?: string; sp?: string; sf?: string }) {
        const merged: Record<string, string | undefined> = {
            cp:    cp    > 1 ? String(cp)    : undefined,
            sp:    sPage > 1 ? String(sPage) : undefined,
            cq:    cq    || undefined,
            cf:    cf    !== "all"    ? cf    : undefined,
            csort: csort !== "newest" ? csort : undefined,
            sf:    sf    !== "all"    ? sf    : undefined,
            ...overrides,
        };
        const qs = Object.entries(merged)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
            .join("&");
        return `/admin/users/${id}${qs ? `?${qs}` : ""}`;
    }

    // Pre-built hrefs for session filter tabs (resets sp to 1)
    const sessionFilterHrefs = {
        all:     buildUrl({ sp: undefined, sf: undefined }),
        active:  (() => { const u = new URLSearchParams(); if (cq) u.set("cq", cq); if (cf !== "all") u.set("cf", cf); if (csort !== "newest") u.set("csort", csort); u.set("sf", "active");  if (cp > 1) u.set("cp", String(cp)); return `/admin/users/${id}?${u.toString()}`; })(),
        revoked: (() => { const u = new URLSearchParams(); if (cq) u.set("cq", cq); if (cf !== "all") u.set("cf", cf); if (csort !== "newest") u.set("csort", csort); u.set("sf", "revoked"); if (cp > 1) u.set("cp", String(cp)); return `/admin/users/${id}?${u.toString()}`; })(),
        expired: (() => { const u = new URLSearchParams(); if (cq) u.set("cq", cq); if (cf !== "all") u.set("cf", cf); if (csort !== "newest") u.set("csort", csort); u.set("sf", "expired"); if (cp > 1) u.set("cp", String(cp)); return `/admin/users/${id}?${u.toString()}`; })(),
    };

    const statusColors: Record<string, string> = {
        active:    "bg-green-50 text-green-700 border-green-100",
        upcoming:  "bg-blue-50 text-blue-700 border-blue-100",
        draft:     "bg-gray-100 text-gray-500 border-gray-200",
        completed: "bg-purple-50 text-purple-700 border-purple-100",
    };

    const displayEmail = user.deleted_at ? (user.deleted_email ?? user.email) : user.email;

    return (
        <div className="space-y-5">
            {/* Back */}
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Users
            </Link>

            {/* Two-column layout */}
            <div className="grid grid-cols-[280px_1fr] gap-6 items-start">

                {/* ── Left column: profile ── */}
                <div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Avatar */}
                        <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100">
                            {user.profile_photo_url ? (
                                <img
                                    src={user.profile_photo_url}
                                    alt=""
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 uppercase select-none">
                                    {user.first_name[0]}{user.last_name[0]}
                                </div>
                            )}
                            <h1 className="mt-3 text-lg font-bold text-gray-900 text-center">
                                {user.first_name} {user.last_name}
                            </h1>
                            {user.username && (
                                <p className="text-sm text-blue-500 font-medium mt-0.5">@{user.username}</p>
                            )}
                            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                                {user.id === currentAdmin?.id && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0268c0] border border-[#0268c0]/20 uppercase tracking-wide">You</span>
                                )}
                                {user.role === "admin" && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 uppercase tracking-wide">Admin</span>
                                )}
                                {user.deleted_at ? (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Deleted</span>
                                ) : user.is_suspended ? (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Suspended</span>
                                ) : (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">Active</span>
                                )}
                            </div>
                        </div>

                        {/* Contact info */}
                        <div className="px-5 py-4 space-y-2.5 text-sm border-b border-gray-100">
                            <div className="flex items-start gap-2.5 text-gray-600">
                                <svg className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="break-all">{displayEmail}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-2.5 text-gray-600">
                                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2.5 text-gray-500">
                                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs">Joined {fmtDate(user.created_at)}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-gray-500">
                                <svg className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div className="text-xs">
                                    {createdVia === "self" && (
                                        <>
                                            <span className="text-gray-600 font-medium">Self-registered</span>
                                            {createdViaCampaign && (
                                                <span className="text-gray-400"> via{" "}
                                                    <Link href={`/admin/campaigns/${createdViaCampaign.slug}`} className="text-[#0268c0] hover:underline">
                                                        {createdViaCampaign.name ?? "campaign"}
                                                    </Link>
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {createdVia === "participant" && (
                                        <>
                                            <span className="text-gray-600 font-medium">Added as participant</span>
                                            {createdViaCampaign && (
                                                <span className="text-gray-400"> in{" "}
                                                    <Link href={`/admin/campaigns/${createdViaCampaign.slug}`} className="text-[#0268c0] hover:underline">
                                                        {createdViaCampaign.name ?? "campaign"}
                                                    </Link>
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {createdVia === "admin" && (
                                        <span className="text-gray-600 font-medium">Created by admin</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Organization (if creator) */}
                        {organization && (
                            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5 text-sm">
                                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <Link
                                    href={`/admin/organizations/${organization.id}`}
                                    className="text-[#0268c0] hover:underline font-medium truncate"
                                >
                                    {organization.name}
                                </Link>
                            </div>
                        )}

                        {/* Stats */}
                        {(() => {
                            const hasActions = user.role !== "admin" || user.id === currentAdmin?.id;
                            return (
                                <div className={`px-5 py-4 grid grid-cols-3 gap-3 text-center ${hasActions ? "border-b border-gray-100" : ""}`}>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Campaigns</p>
                                        <p className="text-sm font-bold text-gray-800">{campaignTotal}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Total Raised</p>
                                        <p className="text-sm font-bold text-gray-800">{fmtUSD(totalRaised)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Verified</p>
                                        <p className={`text-sm font-bold ${user.is_email_verified ? "text-green-600" : "text-gray-400"}`}>
                                            {user.is_email_verified ? "Yes" : "No"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions — hidden when viewing another admin */}
                        {(user.role !== "admin" || user.id === currentAdmin?.id) && (
                            <div className="px-5 py-4 flex flex-col gap-2">
                                {!user.deleted_at && (
                                    <EditUserButton
                                        userId={user.id}
                                        isSelf={user.id === currentAdmin?.id}
                                        initial={{
                                            first_name: user.first_name,
                                            last_name:  user.last_name,
                                            email:      displayEmail,
                                            username:   user.username ?? null,
                                            phone:      user.phone ?? null,
                                            role:       user.role as "user" | "admin",
                                        }}
                                    />
                                )}
                                {user.role !== "admin" && (
                                    <>
                                        {!user.deleted_at && (
                                            <SuspendUserButton
                                                userId={user.id}
                                                isSuspended={user.is_suspended}
                                                suspensionMessage={user.suspension_message ?? null}
                                            />
                                        )}
                                        <DeleteUserButton
                                            userId={user.id}
                                            isDeleted={user.deleted_at !== null}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right column: campaigns + sessions ── */}
                <div className="space-y-6 min-w-0">

                    {/* Campaigns */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Campaigns</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {filteredCampaignTotal !== campaignTotal
                                        ? `${filteredCampaignTotal} of ${campaignTotal} total`
                                        : `${campaignTotal} total`}
                                </p>
                            </div>
                        </div>

                        {/* Search + filters */}
                        <Suspense>
                            <UserCampaignFilters userId={id} />
                        </Suspense>

                        {filteredCampaignTotal === 0 ? (
                            <p className="px-6 py-8 text-sm text-gray-400 text-center">
                                {campaignTotal === 0 ? "No campaigns yet." : "No campaigns match the current filters."}
                            </p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-140">
                                        <thead>
                                            <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                                                <th className="text-left px-6 py-3">Campaign</th>
                                                <th className="text-left px-6 py-3">Role</th>
                                                <th className="text-left px-6 py-3">Status</th>
                                                <th className="text-right px-6 py-3">Raised</th>
                                                <th className="px-6 py-3" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {campaigns.map((c) => (
                                                <tr key={c.slug} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-gray-900">
                                                        <div className="flex items-center gap-3">
                                                            {c.media[0]?.url ? (
                                                                <img
                                                                    src={c.media[0].url}
                                                                    alt=""
                                                                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
                                                                />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p>{c.name ?? <span className="italic text-gray-400">Untitled</span>}</p>
                                                                <p className="text-[10px] text-gray-400 font-normal capitalize mt-0.5">{c.campaign_type}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.roles.map((r) => (
                                                                <span key={r} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{r}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors[c.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-semibold text-gray-700">
                                                        {fmtUSD(parseFloat(c.total_raised.toString()))}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <Link
                                                            href={`/admin/campaigns/${c.slug}`}
                                                            className="text-xs font-semibold text-[#0268c0] hover:underline"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {campaignTotalPages > 1 && (
                                    <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                        <span>Page {cp} of {campaignTotalPages}</span>
                                        <div className="flex items-center gap-2">
                                            {cp > 1 && (
                                                <Link scroll={false} href={buildUrl({ cp: String(cp - 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Previous
                                                </Link>
                                            )}
                                            {cp < campaignTotalPages && (
                                                <Link scroll={false} href={buildUrl({ cp: String(cp + 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sessions */}
                    <UserSessionsSection
                        key={`sessions-p${sPage}-sf${sf}`}
                        userId={user.id}
                        sessions={sessions.map((s) => ({
                            id:         s.id,
                            is_mobile:  s.is_mobile,
                            ip_address: s.ip_address ?? null,
                            user_agent: s.user_agent ?? null,
                            created_at: s.created_at.getTime(),
                            expires_at: s.expires_at?.getTime() ?? null,
                            revoked_at: s.revoked_at?.getTime() ?? null,
                        }))}
                        totalSessions={sessionTotal}
                        currentPage={sPage}
                        totalPages={sessionTotalPages}
                        prevHref={sPage > 1                ? buildUrl({ sp: String(sPage - 1) }) : null}
                        nextHref={sPage < sessionTotalPages ? buildUrl({ sp: String(sPage + 1) }) : null}
                        sessionFilter={sf}
                        filterHrefs={sessionFilterHrefs}
                    />
                </div>
            </div>
        </div>
    );
}
