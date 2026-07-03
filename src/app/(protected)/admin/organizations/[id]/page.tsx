import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrgCampaignsTable from "./_components/OrgCampaignsTable";
import { queryOrgCampaigns, DEFAULT_PAGE_SIZE } from "./_lib/query";

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminOrganizationDetailPage({ params }: Ctx) {
    const { id } = await params;

    const [org, totalCampaigns, activeCampaignCount, statsResult, campaignsFirst] = await Promise.all([
        prisma.organization.findUnique({
            where:  { id },
            select: {
                id: true, name: true, logo_url: true, created_at: true, updated_at: true,
                creator: { select: { id: true, first_name: true, last_name: true, email: true, profile_photo_url: true } },
            },
        }),
        prisma.campaign.count({ where: { organization_id: id } }),
        prisma.campaign.count({ where: { organization_id: id, status: "active" } }),
        prisma.campaign.aggregate({ where: { organization_id: id }, _sum: { total_raised: true } }),
        queryOrgCampaigns({ orgId: id, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    ]);

    if (!org) notFound();

    const totalRaised = parseFloat((statsResult._sum.total_raised ?? 0).toString());

    return (
        <div className="space-y-5">
            {/* Back */}
            <Link href="/admin/organizations" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7e8a96] transition-colors hover:text-[#003060]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to Organizations
            </Link>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* ── Left column: org profile ── */}
                <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                    {/* Logo band */}
                    <div className="flex flex-col items-center border-b border-[#eef1f4] bg-linear-to-b from-[#f2f8ff] to-white px-6 pb-6 pt-8">
                        {org.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={org.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-sm ring-4 ring-[#0268c0]/10" />
                        ) : (
                            <div className="flex h-20 w-20 select-none items-center justify-center rounded-2xl bg-linear-to-br from-[#0268c0] to-[#003060] text-2xl font-bold uppercase text-white shadow-sm ring-4 ring-[#0268c0]/10">
                                {org.name[0]}
                            </div>
                        )}
                        <h1 className="mt-3 text-center text-lg font-bold text-[#003060]">{org.name}</h1>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#9aa7b8]">Organization</p>
                    </div>

                    {/* Creator */}
                    <div className="border-b border-[#eef1f4] px-5 py-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Creator</p>
                        <Link href={`/admin/users/${org.creator.id}`} className="group flex items-center gap-3">
                            {org.creator.profile_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={org.creator.profile_photo_url} alt="" className="h-9 w-9 shrink-0 rounded-full border border-[#e7e9eb] object-cover" />
                            ) : (
                                <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-[#eef2f7] text-sm font-bold uppercase text-[#7e8a96]">
                                    {org.creator.first_name[0]}{org.creator.last_name[0]}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#003060] transition-colors group-hover:text-[#0268c0]">{org.creator.first_name} {org.creator.last_name}</p>
                                <p className="truncate text-xs text-[#9aa7b8]">{org.creator.email}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 border-b border-[#eef1f4] px-5 py-4 text-center">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Campaigns</p>
                            <p className="mt-0.5 text-[15px] font-bold text-[#003060]">{totalCampaigns}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Active</p>
                            <p className={`mt-0.5 text-[15px] font-bold ${activeCampaignCount > 0 ? "text-green-600" : "text-[#9aa7b8]"}`}>{activeCampaignCount}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-[#9aa7b8]">Raised</p>
                            <p className="mt-0.5 text-[15px] font-bold text-[#003060]">{fmtUSD(totalRaised)}</p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2.5 px-5 py-4 text-xs text-[#7e8a96]">
                        <div className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Created {fmtDate(org.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            <span>Updated {fmtDate(org.updated_at)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right column: campaigns ── */}
                <div className="min-w-0">
                    <OrgCampaignsTable
                        orgId={id}
                        initialCampaigns={campaignsFirst.campaigns}
                        initialTotal={campaignsFirst.total}
                        grandTotal={totalCampaigns}
                        initialQuery=""
                        initialStatus="all"
                        initialSort="newest"
                        initialPage={1}
                        initialPageSize={DEFAULT_PAGE_SIZE}
                    />
                </div>
            </div>
        </div>
    );
}
