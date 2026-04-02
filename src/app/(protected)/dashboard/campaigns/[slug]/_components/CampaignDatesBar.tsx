function fmtDateTime(d: Date | null) {
    if (!d) return { date: "—", time: null };
    return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
}

type Props = {
    startDate: Date | null;
    endDate: Date | null;
    daysLeft: number | null;
};

export default function CampaignDatesBar({ startDate, endDate, daysLeft }: Props) {
    const start = fmtDateTime(startDate);
    const end   = fmtDateTime(endDate);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Start Date & Time</p>
                    {startDate ? (
                        <>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{start.date}</p>
                            <p className="text-xs text-gray-400">{start.time}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 font-normal mt-0.5">Not set</p>
                    )}
                </div>
            </div>
            <div className="w-px h-10 bg-gray-100 hidden sm:block" />
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">End Date & Time</p>
                    {endDate ? (
                        <>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{end.date}</p>
                            <p className="text-xs text-gray-400">{end.time}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 font-normal mt-0.5">Not set</p>
                    )}
                </div>
            </div>
            {endDate && daysLeft !== null && (
                <>
                    <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Time Remaining</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            {daysLeft === 0 ? (
                                <span className="text-red-500">Ends today</span>
                            ) : (
                                <span className={daysLeft <= 7 ? "text-orange-500" : ""}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>
                            )}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
