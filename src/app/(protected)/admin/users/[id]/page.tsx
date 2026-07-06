import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import SuspendUserButton  from "./_components/SuspendUserButton";
import DeleteUserButton   from "./_components/DeleteUserButton";
import EditUserButton     from "./_components/EditUserButton";
import UserCampaignsTable  from "./_components/UserCampaignsTable";
import UserSessionsTable    from "./_components/UserSessionsTable";
import { queryUserCampaigns, queryUserSessions, DEFAULT_PAGE_SIZE } from "./_lib/detail-query";

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Ctx) {
    const { id } = await params;
    const currentAdmin = await getAuthUser();

    const [user, totalRaisedResult, firstMembership, organization, campaignsFirst, sessionsFirst] = await Promise.all([
        prisma.user.findUnique({
            where: { id },
            select: {
                id: true, first_name: true, last_name: true, email: true, username: true, phone: true,
                role: true, is_suspended: true, suspension_message: true, deleted_at: true, deleted_email: true,
                is_email_verified: true, is_phone_verified: true, created_at: true, profile_photo_url: true,
            },
        }),
        prisma.campaign.aggregate({ where: { members: { some: { user_id: id } } }, _sum: { total_raised: true } }),
        prisma.campaignMember.findFirst({
            where: { user_id: id },
            orderBy: { created_at: "asc" },
            select: { invite_token: true, roles: { select: { role: true } }, campaign: { select: { name: true, slug: true } } },
        }),
        prisma.organization.findUnique({ where: { created_by: id }, select: { id: true, name: true } }),
        queryUserCampaigns({ userId: id, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
        queryUserSessions({ userId: id, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    ]);

    if (!user) notFound();

    const createdVia = !firstMembership ? "admin" as const : firstMembership.invite_token ? "participant" as const : "self" as const;
    const createdViaCampaign = firstMembership?.campaign ?? null;
    const totalRaised = parseFloat((totalRaisedResult._sum.total_raised ?? 0).toString());
    const campaignTotal = campaignsFirst.total;
    const displayEmail = user.deleted_at ? (user.deleted_email ?? user.email) : user.email;
    const canManage = user.role !== "admin" || user.id === currentAdmin?.id;

    const ICON = "mt-0.5 h-4 w-4 shrink-0 text-[#9aa7b8]";

    return (
        <div className="space-y-5">
            {/* Back */}
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7e8a96] transition-colors hover:text-[#003060]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to Users
            </Link>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* ── Left column: profile ── */}
                <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                    {/* Avatar band */}
                    <div className="flex flex-col items-center border-b border-[#eef1f4] bg-linear-to-b from-[#f2f8ff] to-white px-6 pb-6 pt-8">
                        {user.profile_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profile_photo_url} alt="" className="h-20 w-20 rounded-full object-cover shadow-sm ring-4 ring-[#0268c0]/10" />
                        ) : (
                            <div className="flex h-20 w-20 select-none items-center justify-center rounded-full bg-linear-to-br from-[#0268c0] to-[#003060] text-2xl font-bold uppercase text-white shadow-sm ring-4 ring-[#0268c0]/10">
                                {user.first_name[0]}{user.last_name[0]}
                            </div>
                        )}
                        <h1 className="mt-3 text-center text-lg font-bold text-[#003060]">{user.first_name} {user.last_name}</h1>
                        {user.username && <p className="mt-0.5 text-sm font-medium text-[#0268c0]">@{user.username}</p>}
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                            {user.id === currentAdmin?.id && <span className="rounded border border-[#0268c0]/20 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">You</span>}
                            {user.role === "admin" && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">Admin</span>}
                            {user.deleted_at ? (
                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">Deleted</span>
                            ) : user.is_suspended ? (
                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">Suspended</span>
                            ) : (
                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">Active</span>
                            )}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2.5 border-b border-[#eef1f4] px-5 py-4 text-[13px]">
                        <div className="flex items-start gap-2.5 text-[#5b6b7c]">
                            <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="break-all">{displayEmail}</span>
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-2.5 text-[#5b6b7c]">
                                <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <span>{user.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 text-[#7e8a96]">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-xs">Joined {fmtDate(user.created_at)}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-[#7e8a96]">
                            <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <div className="text-xs">
                                {createdVia === "self" && <><span className="font-medium text-[#5b6b7c]">Self-registered</span>{createdViaCampaign && <span> via <Link href={`/admin/campaigns/${createdViaCampaign.slug}`} className="text-[#0268c0] hover:underline">{createdViaCampaign.name ?? "campaign"}</Link></span>}</>}
                                {createdVia === "participant" && <><span className="font-medium text-[#5b6b7c]">Added as participant</span>{createdViaCampaign && <span> in <Link href={`/admin/campaigns/${createdViaCampaign.slug}`} className="text-[#0268c0] hover:underline">{createdViaCampaign.name ?? "campaign"}</Link></span>}</>}
                                {createdVia === "admin" && <span className="font-medium text-[#5b6b7c]">Created by admin</span>}
                            </div>
                        </div>
                    </div>

                    {/* Organization */}
                    {organization && (
                        <div className="flex items-center gap-2.5 border-b border-[#eef1f4] px-5 py-3 text-[13px]">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <Link href={`/admin/organizations/${organization.id}`} className="truncate font-medium text-[#0268c0] hover:underline">{organization.name}</Link>
                        </div>
                    )}

                    {/* Stats */}
                    <div className={`grid grid-cols-3 gap-2 px-5 py-4 text-center ${canManage ? "border-b border-[#eef1f4]" : ""}`}>
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Campaigns</p>
                            <p className="mt-0.5 text-[15px] font-bold text-[#003060]">{campaignTotal}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Raised</p>
                            <p className="mt-0.5 text-[15px] font-bold text-[#003060]">{fmtUSD(totalRaised)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Verified</p>
                            <p className={`mt-0.5 text-[15px] font-bold ${user.is_email_verified ? "text-green-600" : "text-[#9aa7b8]"}`}>{user.is_email_verified ? "Yes" : "No"}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                        <div className="flex flex-col gap-2 px-5 py-4">
                            {!user.deleted_at && (
                                <EditUserButton
                                    userId={user.id}
                                    isSelf={user.id === currentAdmin?.id}
                                    initial={{
                                        first_name: user.first_name, last_name: user.last_name, email: displayEmail,
                                        username: user.username ?? null, phone: user.phone ?? null, role: user.role as "user" | "admin",
                                        profile_photo_url: user.profile_photo_url ?? null,
                                        is_email_verified: user.is_email_verified, is_phone_verified: user.is_phone_verified,
                                    }}
                                />
                            )}
                            {user.role !== "admin" && (
                                <>
                                    {!user.deleted_at && <SuspendUserButton userId={user.id} isSuspended={user.is_suspended} suspensionMessage={user.suspension_message ?? null} />}
                                    <DeleteUserButton userId={user.id} isDeleted={user.deleted_at !== null} />
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right column: campaigns + sessions ── */}
                <div className="min-w-0 space-y-6">
                    <UserCampaignsTable
                        userId={id}
                        initialCampaigns={campaignsFirst.campaigns}
                        initialTotal={campaignsFirst.total}
                        grandTotal={campaignTotal}
                        initialQuery=""
                        initialFilter="all"
                        initialSort="newest"
                        initialPage={1}
                        initialPageSize={DEFAULT_PAGE_SIZE}
                    />
                    <UserSessionsTable
                        userId={id}
                        initialSessions={sessionsFirst.sessions}
                        initialTotal={sessionsFirst.total}
                        initialActive={sessionsFirst.activeTotal}
                        initialGrand={sessionsFirst.grandTotal}
                        initialQuery=""
                        initialFilter="all"
                        initialPage={1}
                        initialPageSize={DEFAULT_PAGE_SIZE}
                    />
                </div>
            </div>
        </div>
    );
}
