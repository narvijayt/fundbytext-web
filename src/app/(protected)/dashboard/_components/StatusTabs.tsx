import Link from "next/link";

const STATUS_TABS = [
    { key: "all",       label: "All Campaigns" },
    { key: "active",    label: "Active"        },
    { key: "upcoming",  label: "Upcoming"      },
    { key: "draft",     label: "Draft"         },
    { key: "completed", label: "Completed"     },
] as const;

type TabKey = (typeof STATUS_TABS)[number]["key"];

type Props = {
    activeTab: TabKey;
    counts: Record<TabKey, number>;
};

export default function StatusTabs({ activeTab, counts }: Props) {
    return (
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
            {STATUS_TABS.map(({ key, label }) => {
                const isActive = activeTab === key;
                return (
                    <Link
                        key={key}
                        href={key === "all" ? "/dashboard" : `/dashboard?filter=${key}`}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            isActive
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {label}
                        {counts[key] > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                                isActive ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                            }`}>
                                {counts[key]}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

export type { TabKey };
