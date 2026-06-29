/* Shimmering skeleton block. Used by the dashboard + admin route loading.tsx
   files so a skeleton renders inside <main> (the sidebar stays fixed) while the
   real, data-heavy server page streams in. */
export function Sk({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />;
}

/* Table skeleton — a header row + N body rows of `cols` cells. Matches the
   admin list pages (Users / Campaigns / Donations / Organizations / Contacts). */
export function SkTable({ cols = 5, rows = 8 }: { cols?: number; rows?: number }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                {Array.from({ length: cols }).map((_, i) => (
                    <Sk key={i} className={`h-3.5 ${i === 0 ? "w-32" : "flex-1"}`} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Sk key={c} className={`h-4 ${c === 0 ? "w-32" : "flex-1"}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}
