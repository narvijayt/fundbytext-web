/**
 * Placeholder grid shown while the campaign query runs. It stands in for the real
 * CampaignCard grid at the same size, so switching a tab or searching swaps the
 * cards in place — the tabs, hero and search stay put and the click reads as
 * instant, instead of the whole route being replaced by a full-page splash.
 */
export default function CampaignsGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}
                    className="animate-pulse overflow-hidden rounded-[16px] border border-[#eaeef3] bg-white shadow-[0_1px_4px_0_rgba(25,33,61,0.08)]">
                    <div className="h-[180px] w-full bg-[#eaeef3]" />
                    <div className="flex flex-col gap-3 p-5">
                        <div className="h-3 w-24 rounded-full bg-[#eaeef3]" />
                        <div className="h-4 w-3/4 rounded-full bg-[#eaeef3]" />
                        <div className="h-4 w-1/2 rounded-full bg-[#eaeef3]" />
                        <div className="mt-2 h-8 w-full rounded-full bg-[#f2f2f2]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
