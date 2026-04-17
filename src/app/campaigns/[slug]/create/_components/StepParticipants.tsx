"use client";

import { useRef, useState } from "react";
import { type Donor, type Member, type CsvRow, type ImportResult } from "./types";
import { SectionTitle, inputCls } from "./ui";

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCsv(text: string): CsvRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const get = (...keys: string[]) => {
            for (const k of keys) {
                const idx = headers.indexOf(k);
                if (idx >= 0 && cols[idx]) return cols[idx];
            }
            return "";
        };
        const first = get("first_name", "firstname", "first name");
        const last  = get("last_name",  "lastname",  "last name");
        const email = get("email", "email address");
        const phone = get("phone", "phone number", "mobile");
        if (first && last) rows.push({ first_name: first, last_name: last, email, phone });
    }
    return rows;
}

function downloadSample(type: "donor" | "participant") {
    const isParticipant = type === "participant";
    const rows = [
        ["first_name", "last_name", "email", "phone"],
        ...(isParticipant ? [
            ["Alice",   "Williams", "alice.williams@example.com",  "555-111-2222"],
            ["Michael", "Brown",    "michael.brown@example.com",   "555-333-4444"],
            ["Sarah",   "Davis",    "sarah.davis@example.com",     ""],
            ["Chris",   "Lee",      "chris.lee@example.com",       "555-777-8888"],
        ] : [
            ["John",  "Doe",     "john.doe@example.com",     "555-123-4567"],
            ["Jane",  "Smith",   "jane.smith@example.com",   ""],
            ["Bob",   "Johnson", "bob.johnson@example.com",  "555-987-6543"],
            ["Emily", "Clark",   "emily.clark@example.com",  ""],
        ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sample_${type}s.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── CsvImporter ───────────────────────────────────────────────────────────────

function CsvImporter({
    type,
    onImport,
}: {
    type:     "donor" | "participant";
    onImport: (rows: CsvRow[]) => Promise<ImportResult>;
}) {
    const fileRef   = useRef<HTMLInputElement>(null);
    const [rows,     setRows]     = useState<CsvRow[] | null>(null);
    const [fileName, setFileName] = useState("");
    const [importing, setImporting] = useState(false);
    const [result,   setResult]   = useState<ImportResult | null>(null);
    const [error,    setError]    = useState<string | null>(null);

    function handleFile(file: File) {
        setResult(null);
        setError(null);
        setRows(null);
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a .csv file.");
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text   = e.target?.result as string;
            const parsed = parseCsv(text);
            if (parsed.length === 0) {
                setError("No valid rows found. Make sure the file has first_name and last_name columns.");
            } else {
                setRows(parsed);
            }
        };
        reader.readAsText(file);
    }

    async function runImport() {
        if (!rows) return;
        setImporting(true);
        try {
            const r = await onImport(rows);
            setResult(r);
            setRows(null);
            setFileName("");
            if (fileRef.current) fileRef.current.value = "";
        } finally {
            setImporting(false);
        }
    }

    function reset() {
        setRows(null);
        setFileName("");
        setResult(null);
        setError(null);
        if (fileRef.current) fileRef.current.value = "";
    }

    const label = type === "donor" ? "donor" : "participant";

    return (
        <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/40">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Import from CSV
                </p>
                <button
                    type="button"
                    onClick={() => downloadSample(type)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                    </svg>
                    Sample CSV
                </button>
            </div>

            {/* Success */}
            {result && (
                <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700">
                        <span className="font-semibold">{result.added}</span> {label}{result.added !== 1 ? "s" : ""} added
                        {result.skipped > 0 && (
                            <span className="text-green-600"> · {result.skipped} skipped (duplicates or errors)</span>
                        )}
                    </p>
                    <button type="button" onClick={reset} className="text-xs font-medium text-green-600 hover:text-green-800 ml-3 shrink-0">
                        Import more
                    </button>
                </div>
            )}

            {/* Error */}
            {error && !rows && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600 flex-1">{error}</p>
                    <button type="button" onClick={() => { setError(null); fileRef.current?.click(); }}
                        className="text-xs font-medium text-red-600 hover:text-red-800 shrink-0">
                        Try again
                    </button>
                </div>
            )}

            {/* File selected — preview + confirm */}
            {rows && !importing && (
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-600 truncate min-w-0">
                        <span className="font-semibold text-gray-800">{rows.length}</span>{" "}
                        {label}{rows.length !== 1 ? "s" : ""} found
                        <span className="text-gray-400"> · {fileName}</span>
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={reset}
                            className="text-xs text-gray-400 hover:text-gray-600">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={runImport}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Import {rows.length}
                        </button>
                    </div>
                </div>
            )}

            {/* Importing spinner */}
            {importing && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Importing…
                </div>
            )}

            {/* Pick file button — shown when idle or after result */}
            {!rows && !importing && !error && (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose CSV file
                </button>
            )}

            <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                }}
            />
        </div>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type OrganizerInfo = { first_name: string; last_name: string; email: string; phone: string };

type Props = {
    isOrg: boolean;
    isLaunched: boolean;
    organizerInfo?: OrganizerInfo;
    // Org participants
    members: Member[];
    addFirst: string; setAddFirst: (v: string) => void;
    addLast: string;  setAddLast:  (v: string) => void;
    addEmail: string; setAddEmail: (v: string) => void;
    addPhone: string; setAddPhone: (v: string) => void;
    addingMember: boolean;
    onAddParticipant:    () => void;
    onRemoveParticipant: (id: string) => void;
    onImportParticipants?: (rows: CsvRow[]) => Promise<ImportResult>;
    // Individual donors
    donors: Donor[];
    dFirst: string; setDFirst: (v: string) => void;
    dLast: string;  setDLast:  (v: string) => void;
    dEmail: string; setDEmail: (v: string) => void;
    dPhone: string; setDPhone: (v: string) => void;
    addingDonor: boolean;
    onAddDonor:    () => void;
    onRemoveDonor: (id: string) => void;
    onImportDonors?: (rows: CsvRow[]) => Promise<ImportResult>;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StepParticipants({
    isOrg, isLaunched, organizerInfo,
    members,
    addFirst, setAddFirst,
    addLast, setAddLast,
    addEmail, setAddEmail,
    addPhone, setAddPhone,
    addingMember,
    onAddParticipant,
    onRemoveParticipant,
    onImportParticipants,
    donors,
    dFirst, setDFirst,
    dLast, setDLast,
    dEmail, setDEmail,
    dPhone, setDPhone,
    addingDonor,
    onAddDonor,
    onRemoveDonor,
    onImportDonors,
}: Props) {
    function fillMyselfParticipant() {
        if (!organizerInfo) return;
        setAddFirst(organizerInfo.first_name);
        setAddLast(organizerInfo.last_name);
        setAddEmail(organizerInfo.email);
        setAddPhone(organizerInfo.phone);
    }

    const myselfAlreadyDonor = !!organizerInfo &&
        donors.some((d) => d.email?.toLowerCase() === organizerInfo.email?.toLowerCase());

    function fillMyselfDonor() {
        if (!organizerInfo) return;
        setDFirst(organizerInfo.first_name);
        setDLast(organizerInfo.last_name);
        setDEmail(organizerInfo.email);
        setDPhone(organizerInfo.phone);
    }

    const lockedBanner = (label: string) => (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <svg className="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {label} list is locked once the campaign is launched.
        </div>
    );

    // ── Individual campaign — donors ──────────────────────────────────────────

    if (!isOrg) {
        return (
            <div className="space-y-6">
                <div>
                    <SectionTitle>Donors</SectionTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Add the people you plan to contact for donations. They will receive your campaign outreach.
                    </p>
                </div>

                {isLaunched && lockedBanner("Donor")}

                {donors.length > 0 && (
                    <div className="space-y-2">
                        {donors.map((d) => (
                            <div
                                key={d.id}
                                className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {d.first_name} {d.last_name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {[d.email, d.phone].filter(Boolean).join(" · ") || "No contact info"}
                                    </p>
                                </div>
                                {!isLaunched && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveDonor(d.id)}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!isLaunched && (
                    <>
                        {/* Manual add */}
                        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Donor</p>
                                {organizerInfo && !myselfAlreadyDonor && (
                                    <button
                                        type="button"
                                        onClick={fillMyselfDonor}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Add Myself
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={dFirst} onChange={(e) => setDFirst(e.target.value)} placeholder="First name" className={inputCls} />
                                <input value={dLast}  onChange={(e) => setDLast(e.target.value)}  placeholder="Last name"  className={inputCls} />
                            </div>
                            <input type="email" value={dEmail} onChange={(e) => setDEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                            <input type="tel"   value={dPhone} onChange={(e) => setDPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
                            <button
                                type="button"
                                onClick={onAddDonor}
                                disabled={addingDonor}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {addingDonor ? "Adding…" : "+ Add Donor"}
                            </button>
                        </div>

                        {/* CSV import */}
                        {onImportDonors && (
                            <CsvImporter type="donor" onImport={onImportDonors} />
                        )}
                    </>
                )}
            </div>
        );
    }

    // ── Organization campaign — participants ──────────────────────────────────

    const participants   = members.filter((m) => m.roles.some((r) => r.role === "participant"));
    const isOrganizerOnly = (m: Member) =>
        m.roles.some((r) => r.role === "organizer") && !m.roles.some((r) => r.role === "participant");

    return (
        <div className="space-y-6">
            <div>
                <SectionTitle>Participants</SectionTitle>
                <p className="text-sm text-gray-500 mt-1">
                    Add people who will fundraise as part of this campaign. Each participant receives an invite link.
                </p>
            </div>

            {isLaunched && lockedBanner("Participant")}

            {participants.length > 0 && (
                <div className="space-y-2">
                    {participants.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    {m.first_name} {m.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{m.email ?? m.phone ?? "No contact info"}</p>
                            </div>
                            {!isLaunched && !isOrganizerOnly(m) && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveParticipant(m.id)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isLaunched && (
                <>
                    {/* Manual add */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Participant</p>
                            {organizerInfo && (
                                <button
                                    type="button"
                                    onClick={fillMyselfParticipant}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Add Myself
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={addFirst} onChange={(e) => setAddFirst(e.target.value)} placeholder="First name" className={inputCls} />
                            <input value={addLast}  onChange={(e) => setAddLast(e.target.value)}  placeholder="Last name"  className={inputCls} />
                        </div>
                        <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                        <input type="tel"   value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
                        <button
                            type="button"
                            onClick={onAddParticipant}
                            disabled={addingMember}
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {addingMember ? "Adding…" : "+ Add Participant"}
                        </button>
                    </div>

                    {/* CSV import */}
                    {onImportParticipants && (
                        <CsvImporter type="participant" onImport={onImportParticipants} />
                    )}
                </>
            )}
        </div>
    );
}
