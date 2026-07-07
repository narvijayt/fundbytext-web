import { queryAdminCampaigns, DEFAULT_PAGE_SIZE, normalizeFilter, normalizeSort } from "./_lib/query";
import AdminCampaignsTable from "./_components/AdminCampaignsTable";
import GlobalCampaignVideo from "./_components/GlobalCampaignVideo";
import { getDefaultCampaignVideo } from "@/lib/settings";

// Thin shell: renders the heading immediately and hands the first page to the
// client table. All subsequent search / filter / sort / paging refetches happen
// in-place (with skeleton rows) via /api/v1/admin/campaigns — no full-page reload.
export default async function AdminCampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const filter = normalizeFilter(typeof sp.filter === "string" ? sp.filter : "all");
    const sort   = normalizeSort(typeof sp.sort     === "string" ? sp.sort   : "newest");
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;

    const [{ campaigns, total, pageSize }, defaultVideo] = await Promise.all([
        queryAdminCampaigns({ query, filter, sort, page, pageSize: DEFAULT_PAGE_SIZE }),
        getDefaultCampaignVideo(),
    ]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-[22px] font-black text-[#003060]">Campaigns</h1>
                <GlobalCampaignVideo currentUrl={defaultVideo} />
            </div>
            <AdminCampaignsTable
                initialCampaigns={campaigns}
                initialTotal={total}
                initialQuery={query}
                initialFilter={filter}
                initialSort={sort}
                initialPage={page}
                initialPageSize={pageSize}
            />
        </div>
    );
}
