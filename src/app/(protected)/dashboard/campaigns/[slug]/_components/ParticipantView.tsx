"use client";

import { useState } from "react";
import AddDonorModal from "./AddDonorModal";

function fmt(n: number | null) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export type MyDonorContact = {
    id:         string;
    first_name: string;
    last_name:  string;
    email:      string | null;
    phone:      string | null;
    status:     string;
};

type Props = {
    myRaised:     number;
    myTarget:     number | null;
    myDonorCount: number;
    myDonors:     MyDonorContact[];
    campaignSlug: string;
};

export default function ParticipantView({ myRaised, myTarget, myDonorCount, myDonors, campaignSlug }: Props) {
    const [addDonorOpen, setAddDonorOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Personal stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Donors Added</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {myDonorCount}
                        {myTarget ? <span className="text-gray-400 font-medium text-lg">/{myTarget}</span> : null}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{myTarget ? "of target" : "contacts added"}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Donated to Me</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {myDonors.filter((d) => d.status === "donated").length}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">of {myDonorCount} added</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">My Amount Raised</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(myRaised)}</p>
                </div>
            </div>

            {/* My donor contacts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">My Donor Contacts</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {myDonors.length}
                        </span>
                        <button
                            onClick={() => setAddDonorOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Donor
                        </button>
                    </div>
                </div>

                {myDonors.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-sm text-gray-400">No donor contacts yet.</p>
                        <p className="text-xs text-gray-300 mt-1">Add donors to start reaching out.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {myDonors.map((d) => (
                            <div key={d.id} className="flex items-center gap-4 px-6 py-3.5">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                    {d.first_name[0]}{d.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{d.first_name} {d.last_name}</p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {[d.email, d.phone].filter(Boolean).join(" · ") || "No contact info"}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    d.status === "donated"   ? "bg-green-100 text-green-700" :
                                    d.status === "contacted" ? "bg-blue-100 text-blue-700"   :
                                                               "bg-gray-100 text-gray-500"
                                }`}>
                                    {d.status === "not_donated" ? "Pending" : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {addDonorOpen && (
                <AddDonorModal
                    campaignSlug={campaignSlug}
                    participants={[]}
                    isOrganizer={false}
                    onClose={() => setAddDonorOpen(false)}
                />
            )}
        </div>
    );
}
