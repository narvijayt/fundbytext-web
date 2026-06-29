import Link from "next/link";

const STATUS_TABS = [
    { key: "all",       label: "All Campaigns" },
    { key: "active",    label: "Active"        },
    { key: "upcoming",  label: "Upcoming"      },
    { key: "draft",     label: "Drafts"        },
    { key: "completed", label: "Completed"     },
] as const;

type TabKey = (typeof STATUS_TABS)[number]["key"];

export default function StatusTabs({ activeTab, query }: { activeTab: TabKey; query?: string }) {
    const qPart = query ? `q=${encodeURIComponent(query)}` : "";
    return (
        <div className="flex gap-5 overflow-x-auto overflow-y-hidden border-b border-[#e7e9eb] -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_TABS.map(({ key, label }) => {
                const isActive = activeTab === key;
                const params = [key !== "all" ? `filter=${key}` : "", qPart].filter(Boolean).join("&");
                const href = params ? `/dashboard?${params}` : "/dashboard";
                return (
                    <Link
                        key={key}
                        href={href}
                        className={`relative shrink-0 whitespace-nowrap border-b-2 py-3 text-[12px] font-black uppercase leading-none tracking-[1px] transition-colors ${
                            isActive ? "border-[#0268c0] text-[#0268c0]" : "border-transparent text-[#7e8a96] hover:text-[#003060]"
                        }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}

export type { TabKey };
