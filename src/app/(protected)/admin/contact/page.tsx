import { queryAdminContact, DEFAULT_PAGE_SIZE, normalizeFilter, normalizeSort } from "./_lib/query";
import AdminContactTable from "./_components/AdminContactTable";
import ContactRecipientsCard from "./_components/ContactRecipientsCard";
import { getContactRecipients, DEFAULT_CONTACT_RECIPIENT } from "@/lib/settings";

// Thin shell: renders the heading immediately and hands the first page to the
// client table. Search / filter / sort / paging + mark-read refetch in-place
// (with skeleton rows) via /api/v1/admin/contact — no full-page reload.
export default async function AdminContactPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const filter = normalizeFilter(typeof sp.filter === "string" ? sp.filter : "all");
    const sort   = normalizeSort(typeof sp.sort     === "string" ? sp.sort   : "newest");
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;

    const [{ submissions, total, unread, pageSize }, recipients] = await Promise.all([
        queryAdminContact({ query, filter, sort, page, pageSize: DEFAULT_PAGE_SIZE }),
        getContactRecipients(),
    ]);

    return (
        <div>
            {/* Recipients is a rarely-touched setting, so it sits as a compact
                action on the heading row — the listing keeps the top of the fold. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-[22px] font-black text-[#003060]">Contact Submissions</h1>
                <ContactRecipientsCard initial={recipients} fallback={DEFAULT_CONTACT_RECIPIENT} />
            </div>
            <AdminContactTable
                initialSubmissions={submissions}
                initialTotal={total}
                initialUnread={unread}
                initialQuery={query}
                initialFilter={filter}
                initialSort={sort}
                initialPage={page}
                initialPageSize={pageSize}
            />
        </div>
    );
}
