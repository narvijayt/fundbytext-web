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
                    <h1 className="text-[22px] font-black text-[#003060]">Contact Submissions</h1>
                    <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total · {unread.toLocaleString()} unread</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="mb-5 flex w-fit items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white p-1 text-xs font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                {(["all", "unread"] as const).map((f) => (
                    <Link
                        key={f}
                        href={f === "all" ? "/admin/contact" : "/admin/contact?filter=unread"}
                        className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:text-[#003060]"}`}
                    >
                        {f}{f === "unread" && unread > 0 ? ` (${unread})` : ""}
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#0268c0] text-white">
                            <th className="w-[200px] px-4 py-3.5 pl-5 text-left text-[13px] font-semibold">From</th>
                            <th className="w-[150px] px-4 py-3.5 text-left text-[13px] font-semibold">Inquiry Type</th>
                            <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Message</th>
                            <th className="w-[150px] px-4 py-3.5 text-left text-[13px] font-semibold">Received</th>
                            <th className="w-[110px] py-3.5 pl-4 pr-5" />
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No contact submissions yet.</td></tr>
                        )}
                        {submissions.map((s) => (
                            <tr key={s.id} className={`border-b border-[#eef1f4] align-top transition-colors last:border-0 ${s.is_read ? "hover:bg-[#f7f9fb]" : "bg-blue-50/40 hover:bg-blue-50/70"}`}>
                                <td className="py-4 pl-5 pr-4">
                                    <div className="flex items-start gap-2">
                                        {!s.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0268c0]" title="Unread" />}
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-semibold text-[#003060]">{s.first_name} {s.last_name}</p>
                                            <a href={`mailto:${s.email}`} className="break-all text-xs text-[#0268c0] hover:underline">{s.email}</a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="inline-flex items-center rounded-full bg-[#feece4] px-2.5 py-1 text-[11px] font-semibold text-[#f47435]">{s.inquiry_type}</span>
                                </td>
                                <td className="max-w-md px-4 py-4 text-[13px] text-[#7e8a96]">
                                    <p className="whitespace-pre-wrap leading-relaxed">{s.message}</p>
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#7e8a96]">{fmtDate(s.created_at)}</td>
                                <td className="py-4 pl-4 pr-5 text-right">
                                    <form action={toggleRead}>
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="next" value={String(!s.is_read)} />
                                        <button type="submit" className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0268c0] transition-colors hover:bg-[#0268c0]/10">
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
