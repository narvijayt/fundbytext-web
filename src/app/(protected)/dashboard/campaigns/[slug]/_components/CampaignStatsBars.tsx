import StatBuddyTip from "./StatBuddyTip";

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

type Cell = { label: string; value: string; tip: string };

// A single stat: uppercase label + clickable FundBuddy mascot (opens an info
// popover), big navy value below.
function StatCell({ label, value, tip }: Cell) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-1.5">
                <span className="min-w-0 text-[11px] font-bold uppercase leading-tight tracking-[1px] text-[#7e8a96]">{label}</span>
                <StatBuddyTip label={label} tip={tip} />
            </div>
            <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{value}</p>
        </div>
    );
}

export default function CampaignStatsBars(props: Props) {
    const title = props.title ?? (props.section === "overall" ? "Overall Statistics" : "Participant Statistics");

    const cells: Cell[] = props.section === "overall"
        ? [
            { label: "Potential Donors",            value: props.potentialDonors.toLocaleString(),
              tip: "This number represents individuals who have shown interest in your campaign but haven't donated yet. They may have interacted with your content, visited your donation page, or signed up for updates. Engage them with personalized outreach to convert their interest into support." },
            { label: "Donor Engagement %",          value: `${props.donorEngagementPct.toFixed(2)}%`,
              tip: "The share of your potential donors who have actually made a donation. A higher percentage means your outreach is doing a great job of turning interest into real contributions." },
            { label: "Average Donation",            value: fmtUSD(props.avgDonation),
              tip: "The average size of a single completed donation. Use it to set suggested giving amounts and to understand how generous your typical supporter is." },
            { label: "Average Amount of $ Per Day", value: fmtUSD(props.avgPerDay),
              tip: "How much your campaign raises on an average day since it started. It's a quick way to gauge momentum and see whether you're on pace to reach your goal." },
          ]
        : [
            { label: "Amount Raised from Anonymous Donors", value: fmtUSD(props.anonRaised),
              tip: "The total raised by donors who chose to keep their name private. Their contributions still count fully toward your goal — only their identity is hidden." },
            { label: "Total Money Raised",                  value: fmtUSD(props.totalRaised),
              tip: "The full amount you've personally raised for this campaign across every donor you've brought in." },
            { label: "Percentage Contributed",              value: props.pctOfGoal !== null ? `${props.pctOfGoal.toFixed(2)}%` : "—",
              tip: "Your share of the campaign's overall total — how much of everything raised so far has come through you." },
            { label: "Avg Donation Per Donor",              value: fmtUSD(props.avgPerDonor),
              tip: "The average gift size among the donors you've brought in. It helps you see how much each of your supporters typically contributes." },
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
