const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

function StatCell({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                {icon}
                {label}
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconUsers() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
}
function IconChart() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
}
function IconCash() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
}
function IconCalendar() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
}
function IconShield() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
}
function IconTrending() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>;
}
function IconStar() {
    return <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

import React from "react";

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignStatsBars(props: Props) {
    return (
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
            {props.section === "overall" && (
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-5">{props.title ?? "Overall Statistics"}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <StatCell label="Potential Donors"      value={props.potentialDonors.toLocaleString()}      icon={<IconUsers />}    />
                        <StatCell label="Donor Engagement %"    value={`${props.donorEngagementPct.toFixed(2)}%`}   icon={<IconChart />}    />
                        <StatCell label="Average Donation"      value={fmtUSD(props.avgDonation)}                   icon={<IconCash />}     />
                        <StatCell label="Avg Amount of $ Per Day" value={fmtUSD(props.avgPerDay)}                   icon={<IconCalendar />} />
                    </div>
                </div>
            )}

            {props.section === "participant" && (
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-5">Participant Statistics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <StatCell label="Amount Raised from Anonymous Donors" value={fmtUSD(props.anonRaised)}                                             icon={<IconShield />}   />
                        <StatCell label="Total Money Raised"                  value={fmtUSD(props.totalRaised)}                                            icon={<IconCash />}     />
                        <StatCell label="Percentage Contributed"              value={props.pctOfGoal !== null ? `${props.pctOfGoal.toFixed(2)}%` : "—"}    icon={<IconTrending />} />
                        <StatCell label="Avg Donation Per Donor"              value={fmtUSD(props.avgPerDonor)}                                            icon={<IconStar />}     />
                    </div>
                </div>
            )}
        </div>
    );
}
