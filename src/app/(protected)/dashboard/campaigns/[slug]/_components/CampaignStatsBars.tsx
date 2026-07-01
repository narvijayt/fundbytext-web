const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type OverallStats = {
    potentialDonors:    number;
    donorEngagementPct: number;
    avgDonation:        number;
    avgPerDay:          number;
};

type ParticipantStats = {
    anonRaised:  number;
    totalRaised: number;
    pctOfGoal:   number | null;
    avgPerDonor: number;
};

type Props =
    | ({ section: "overall";     title?: string } & OverallStats)
    | ({ section: "participant"; title?: string } & ParticipantStats);

type Cell = { label: string; value: string };

// A single stat: uppercase label + FundBuddy mascot, big navy value below.
function StatCell({ label, value }: Cell) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-1.5">
                <span className="min-w-0 text-[11px] font-bold uppercase leading-tight tracking-[1px] text-[#7e8a96]">{label}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/dashboard/fundbuddy.svg" alt="" aria-hidden="true" className="h-7 w-auto shrink-0" />
            </div>
            <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{value}</p>
        </div>
    );
}

export default function CampaignStatsBars(props: Props) {
    const title = props.title ?? (props.section === "overall" ? "Overall Statistics" : "Participant Statistics");

    const cells: Cell[] = props.section === "overall"
        ? [
            { label: "Potential Donors",            value: props.potentialDonors.toLocaleString() },
            { label: "Donor Engagement %",          value: `${props.donorEngagementPct.toFixed(2)}%` },
            { label: "Average Donation",            value: fmtUSD(props.avgDonation) },
            { label: "Average Amount of $ Per Day", value: fmtUSD(props.avgPerDay) },
          ]
        : [
            { label: "Amount Raised from Anonymous Donors", value: fmtUSD(props.anonRaised) },
            { label: "Total Money Raised",                  value: fmtUSD(props.totalRaised) },
            { label: "Percentage Contributed",              value: props.pctOfGoal !== null ? `${props.pctOfGoal.toFixed(2)}%` : "—" },
            { label: "Avg Donation Per Donor",              value: fmtUSD(props.avgPerDonor) },
          ];

    return (
        <div>
            <h3 className="mb-4 text-[20px] font-black text-[#003060]">{title}</h3>
            <div className="flex flex-col divide-y divide-[#eef1f4] overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] sm:flex-row sm:divide-x sm:divide-y-0">
                {cells.map((c) => <StatCell key={c.label} {...c} />)}
            </div>
        </div>
    );
}
