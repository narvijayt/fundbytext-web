import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Server action — toggle the read flag on a submission (admin only).
async function toggleRead(formData: FormData) {
    "use server";
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return;
    const id = String(formData.get("id"));
    const next = formData.get("next") === "true";
    await prisma.contactSubmission.update({ where: { id }, data: { is_read: next } });
    revalidatePath("/admin/contact");
}

export default async function AdminContactPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const sp = await searchParams;
    const filter = sp.filter === "unread" ? "unread" : "all";
    const where = filter === "unread" ? { is_read: false } : {};

    const [submissions, total, unread] = await Promise.all([
        prisma.contactSubmission.findMany({ where, orderBy: { created_at: "desc" }, take: 200 }),
        prisma.contactSubmission.count(),
        prisma.contactSubmission.count({ where: { is_read: false } }),
    ]);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total · {unread.toLocaleString()} unread</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-semibold w-fit mb-5">
                {(["all", "unread"] as const).map((f) => (
                    <Link
                        key={f}
                        href={f === "all" ? "/admin/contact" : "/admin/contact?filter=unread"}
                        className={`px-3 py-1.5 rounded-md capitalize transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {f}{f === "unread" && unread > 0 ? ` (${unread})` : ""}
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-5 py-3 w-[200px]">From</th>
                            <th className="text-left px-5 py-3 w-[150px]">Inquiry Type</th>
                            <th className="text-left px-5 py-3">Message</th>
                            <th className="text-left px-5 py-3 w-[150px]">Received</th>
                            <th className="px-5 py-3 w-[110px]" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {submissions.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-12 text-gray-400">No contact submissions yet.</td></tr>
                        )}
                        {submissions.map((s) => (
                            <tr key={s.id} className={`align-top transition-colors ${s.is_read ? "hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50/70"}`}>
                                <td className="px-5 py-4 font-medium text-gray-900">
                                    <div className="flex items-start gap-2">
                                        {!s.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0268c0] shrink-0" title="Unread" />}
                                        <div className="min-w-0">
                                            <p className="truncate">{s.first_name} {s.last_name}</p>
                                            <a href={`mailto:${s.email}`} className="text-xs text-[#0268c0] hover:underline break-all">{s.email}</a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-[#feece4] text-[#f47435]">{s.inquiry_type}</span>
                                </td>
                                <td className="px-5 py-4 text-gray-600 max-w-md">
                                    <p className="whitespace-pre-wrap leading-relaxed">{s.message}</p>
                                </td>
                                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                                <td className="px-5 py-4 text-right">
                                    <form action={toggleRead}>
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="next" value={String(!s.is_read)} />
                                        <button type="submit" className="text-xs font-semibold text-[#0268c0] hover:underline whitespace-nowrap">
                                            {s.is_read ? "Mark unread" : "Mark read"}
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
