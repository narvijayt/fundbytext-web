import Link from "next/link";
import CampaignCard from "@/app/(protected)/dashboard/_components/CampaignCard";
import Pagination from "@/app/(protected)/dashboard/_components/Pagination";
import { getCampaigns, PAGE_SIZE, type FilterKey } from "../_data";

/**
 * The results half of the browse page: the campaign grid (or the empty state) plus
 * pagination. It's the only part that waits on the database, so the page renders
 * its hero/search/tabs immediately and streams this in behind a Suspense skeleton.
 */
export default async function CampaignsResults({ filter, q, rawPage }: {
    filter: FilterKey; q: string; rawPage?: string;
}) {
    const campaigns = await getCampaigns(filter, q);

    // Page the list the same way the dashboard does: clamp the requested page so a
    // stale ?page= (or one left over after filtering) still lands on real results.
    const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
    const current    = Math.min(Math.max(1, parseInt(rawPage ?? "1", 10) || 1), totalPages);
    const pageItems  = campaigns.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const linkParams = [filter !== "all" ? `filter=${filter}` : "", q ? `q=${encodeURIComponent(q)}` : ""].filter(Boolean).join("&");

    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#eaeef3] bg-white py-20 text-center shadow-[0_1px_4px_0_rgba(25,33,61,0.08)]">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5fc]">
                    <svg className="h-6 w-6 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                </span>
                <p className="font-black text-[#003060] text-[20px] leading-[1.25]">No campaigns found</p>
                <p className="mt-2 max-w-[380px] text-[15px] leading-[1.4] text-[#7e8a96]">
                    {q ? <>Nothing matches “<span className="font-semibold text-[#003060]">{q}</span>”. Try a different name or organization.</> : "There are no campaigns in this category yet."}
                </p>
                <Link href={q ? "/campaigns" : "/campaigns/create"}
                    className="relative mt-6 overflow-hidden rounded-[16px] px-6 py-3.5 text-white font-black text-xs tracking-[1px] uppercase transition-transform hover:scale-105"
                    style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                    <span className="relative z-10">{q ? "Clear search" : "Start the first one"}</span>
                    <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((c) => (
                    <CampaignCard key={c.slug} campaign={c} variant="public" />
                ))}
            </div>
            {totalPages > 1 && (
                <div className="mt-10">
                    <Pagination page={current} totalPages={totalPages} params={linkParams} basePath="/campaigns" scroll={false} />
                </div>
            )}
        </>
    );
}

/** The "N campaigns" tally in the tab bar. Shares `getCampaigns`' cached result. */
export async function CampaignCount({ filter, q }: { filter: FilterKey; q: string }) {
    const campaigns = await getCampaigns(filter, q);
    return <>{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</>;
}
