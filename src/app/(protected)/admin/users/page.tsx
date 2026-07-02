import { getAuthUser } from "@/lib/session";
import { queryAdminUsers, DEFAULT_PAGE_SIZE, normalizeFilter, normalizeSort } from "./_lib/query";
import AdminUsersTable from "./_components/AdminUsersTable";

// Thin shell: renders the heading immediately and hands the first page to the
// client table. Search / filter / sort / paging + create refetch in-place (with
// skeleton rows) via /api/v1/admin/users — no full-page reload.
export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const [sp, currentAdmin] = await Promise.all([searchParams, getAuthUser()]);
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const filter = normalizeFilter(typeof sp.filter === "string" ? sp.filter : "all");
    const sort   = normalizeSort(typeof sp.sort     === "string" ? sp.sort   : "newest");
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;

    const { users, total, pageSize } = await queryAdminUsers({ query, filter, sort, page, pageSize: DEFAULT_PAGE_SIZE });

    return (
        <div>
            <h1 className="text-[22px] font-black text-[#003060]">Users</h1>
            <AdminUsersTable
                initialUsers={users}
                initialTotal={total}
                initialQuery={query}
                initialFilter={filter}
                initialSort={sort}
                initialPage={page}
                initialPageSize={pageSize}
                currentUserId={currentAdmin?.id ?? ""}
            />
        </div>
    );
}
