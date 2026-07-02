import { queryAdminOrganizations, DEFAULT_PAGE_SIZE, normalizeFilter, normalizeSort } from "./_lib/query";
import AdminOrganizationsTable from "./_components/AdminOrganizationsTable";

// Thin shell: renders the heading immediately and hands the first page to the
// client table. Search / filter / sort / paging refetch in-place (with skeleton
// rows) via /api/v1/admin/organizations — no full-page reload.
export default async function AdminOrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const filter = normalizeFilter(typeof sp.filter === "string" ? sp.filter : "all");
    const sort   = normalizeSort(typeof sp.sort     === "string" ? sp.sort   : "newest");
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;

    const { organizations, total, pageSize } = await queryAdminOrganizations({ query, filter, sort, page, pageSize: DEFAULT_PAGE_SIZE });

    return (
        <div>
            <h1 className="text-[22px] font-black text-[#003060]">Organizations</h1>
            <AdminOrganizationsTable
                initialOrganizations={organizations}
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
