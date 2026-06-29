import Link from "next/link";

function pageList(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push("…");
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push("…");
    out.push(total);
    return out;
}

export default function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: string }) {
    if (totalPages <= 1) return null;
    const href = (p: number) => `/dashboard?${[params, `page=${p}`].filter(Boolean).join("&")}`;
    const boxCls = "flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7e9eb] text-[#003060]";

    function Arrow({ dir }: { dir: "prev" | "next" }) {
        const target = dir === "prev" ? page - 1 : page + 1;
        const disabled = dir === "prev" ? page <= 1 : page >= totalPages;
        const d = dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";
        const icon = <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
        return disabled
            ? <span className={`${boxCls} opacity-40`}>{icon}</span>
            : <Link href={href(target)} className={`${boxCls} transition-colors hover:border-[#0268c0]`}>{icon}</Link>;
    }

    return (
        <nav className="flex items-center justify-center gap-2">
            <Arrow dir="prev" />
            {pageList(page, totalPages).map((p, i) =>
                p === "…" ? (
                    <span key={`e${i}`} className="px-1 text-[14px] font-bold text-[#9aa7b8]">…</span>
                ) : (
                    <Link
                        key={p}
                        href={href(p)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-bold transition-colors ${
                            p === page ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-[#f4f8f9]"
                        }`}
                    >
                        {p}
                    </Link>
                )
            )}
            <Arrow dir="next" />
        </nav>
    );
}
