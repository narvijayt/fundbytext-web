"use client";

import { useRef, useState } from "react";
import { type Donor, type Member, type CsvRow, type ImportResult } from "./types";
import { inputCls } from "./ui";

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
    const rows = [
        ["first_name", "last_name", "email", "phone"],
        ...(type === "participant" ? [
            ["Alice",   "Williams", "alice.williams@example.com", "555-111-2222"],
            ["Michael", "Brown",    "michael.brown@example.com",  "555-333-4444"],
        ] : [
            ["John", "Doe",   "john.doe@example.com",   "555-123-4567"],
            ["Jane", "Smith", "jane.smith@example.com",  ""],
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

// ── CsvImporter (compact) ─────────────────────────────────────────────────────

function CsvImporter({ type, onImport, onClose }: {
    type: "donor" | "participant";
    onImport: (rows: CsvRow[]) => Promise<ImportResult>;
    onClose: () => void;
}) {
    const fileRef   = useRef<HTMLInputElement>(null);
    const [rows,      setRows]      = useState<CsvRow[] | null>(null);
    const [fileName,  setFileName]  = useState("");
    const [importing, setImporting] = useState(false);
    const [result,    setResult]    = useState<ImportResult | null>(null);
    const [error,     setError]     = useState<string | null>(null);

    function handleFile(file: File) {
        setResult(null); setError(null); setRows(null);
        if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please select a .csv file."); return; }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const parsed = parseCsv(e.target?.result as string);
            if (parsed.length === 0) setError("No valid rows found — need first_name and last_name columns.");
            else setRows(parsed);
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
        } finally { setImporting(false); }
    }

    const label = type === "donor" ? "donor" : "participant";

    return (
        <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/60 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Import from CSV</p>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => downloadSample(type)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Sample CSV
                    </button>
                    <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
                        Close
                    </button>
                </div>
            </div>

            {result && (
                <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700">
                        <span className="font-semibold">{result.added}</span> {label}{result.added !== 1 ? "s" : ""} added
                        {result.skipped > 0 && <span className="text-green-600"> · {result.skipped} skipped</span>}
                    </p>
                    <button type="button" onClick={() => setResult(null)} className="text-xs font-medium text-green-600 ml-3">Import more</button>
                </div>
            )}
            {error && !rows && (
                <p className="text-xs text-red-600 px-1">{error}</p>
            )}
            {rows && !importing && (
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-600 truncate min-w-0">
                        <span className="font-semibold">{rows.length}</span> {label}{rows.length !== 1 ? "s" : ""} found
                        <span className="text-gray-400"> · {fileName}</span>
                    </p>
                    <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => setRows(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        <button type="button" onClick={runImport} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg">
                            Import {rows.length}
                        </button>
                    </div>
                </div>
            )}
            {importing && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Importing…
                </div>
            )}
            {!rows && !importing && !error && !result && (
                <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose CSV file
                </button>
            )}
            <input ref={fileRef} type="file" accept=".csv" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
    );
}

// ── PhoneInput ────────────────────────────────────────────────────────────────

function PhoneInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white">
            <span className="flex items-center px-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0 select-none">+1</span>
            <input
                type="tel"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? "(214) 987-6543"}
                className="flex-1 px-3 py-3 text-sm bg-white focus:outline-none placeholder:text-gray-400 min-w-0"
            />
        </div>
    );
}

// ── FundBuddy bar ─────────────────────────────────────────────────────────────

function FundBuddyBar({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border-t border-orange-100">
            <svg className="w-9 h-9 shrink-0" viewBox="0 0 48 48" fill="none">
                <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
                <circle cx="24" cy="16" r="11" fill="#F97316" />
                <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
                <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
                <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
                <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
                <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
                <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
            </svg>
            <p className="text-[11px] text-gray-600 flex-1 leading-relaxed">{text}</p>
            <button type="button" className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-full transition-colors">
                Ask FundBuddy
            </button>
        </div>
    );
}

// ── Step sub-banner ───────────────────────────────────────────────────────────

function SubBanner({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center -mx-4">
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext x='10' y='44' font-size='40' font-family='sans-serif' fill='white'%3E%3F%3C/text%3E%3C/svg%3E")`,
                    backgroundSize: "60px 60px",
                }}
            />
            <div className="relative z-10 flex justify-center">
                <div
                    className="px-10 py-4 text-center min-w-65"
                    style={{
                        background: "linear-gradient(180deg, #1A3F8F 0%, #0D2860 100%)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                    }}
                >
                    <h2 className="text-xl font-extrabold text-white tracking-wide">{title}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                        <span className="text-blue-300 text-sm select-none">—</span>
                        <p className="text-blue-200 text-xs font-medium">{subtitle}</p>
                        <span className="text-blue-300 text-sm select-none">—</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Accordion row (saved item) ────────────────────────────────────────────────

function SavedRow({
    index, name, contactInfo, status,
    expanded, onToggle,
    onRemove, locked,
}: {
    index: number;
    name: string;
    contactInfo: string;
    status: "added" | "pending";
    expanded: boolean;
    onToggle: () => void;
    onRemove?: () => void;
    locked?: boolean;
}) {
    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-white"}`}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
                {/* Icon */}
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="flex-1 text-sm font-semibold text-gray-800">
                    {index}. <span className="text-gray-500 font-normal ml-1">({name})</span>
                </span>
                {/* Status dot */}
                {status === "added" && (
                    <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm4.7 7.3a1 1 0 00-1.4-1.4L11 12.18l-2.3-2.3a1 1 0 00-1.4 1.42l3 3a1 1 0 001.4 0l5-5z" clipRule="evenodd" />
                    </svg>
                )}
                {status === "pending" && (
                    <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
                )}
                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {expanded && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500">{contactInfo || "No contact info"}</p>
                    {!locked && onRemove && (
                        <button type="button" onClick={onRemove} className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700">
                            Remove
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Add form row ──────────────────────────────────────────────────────────────

function AddForm({
    index, label,
    first, setFirst,
    last, setLast,
    email, setEmail,
    phone, setPhone,
    adding, onAdd,
    myselfInfo, myselfAlready,
}: {
    index: number;
    label: string;
    first: string; setFirst: (v: string) => void;
    last: string;  setLast:  (v: string) => void;
    email: string; setEmail: (v: string) => void;
    phone: string; setPhone: (v: string) => void;
    adding: boolean;
    onAdd: () => void;
    myselfInfo?: { first_name: string; last_name: string; email: string; phone: string } | null;
    myselfAlready?: boolean;
}) {
    const isEmpty = !first && !last && !email && !phone;

    return (
        <div className="border border-blue-200 bg-blue-50/20 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="flex-1 text-sm font-semibold text-gray-700">{label} {index}</span>
                {myselfInfo && !myselfAlready && isEmpty && (
                    <button
                        type="button"
                        onClick={() => {
                            setFirst(myselfInfo.first_name);
                            setLast(myselfInfo.last_name);
                            setEmail(myselfInfo.email);
                            setPhone(myselfInfo.phone);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                        Add Myself
                    </button>
                )}
                <svg className="w-4 h-4 text-gray-400 shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Fields */}
            <div className="px-4 pb-4 pt-2 space-y-3">
                <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contact Name</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First Name" className={inputCls} />
                        <input value={last}  onChange={(e) => setLast(e.target.value)}  placeholder="Last Name"  className={inputCls} />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Phone</label>
                    <PhoneInput value={phone} onChange={setPhone} />
                </div>
                <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter a valid email address" className={inputCls} />
                </div>
            </div>
        </div>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type OrganizerInfo = { first_name: string; last_name: string; email: string; phone: string };

type Props = {
    isOrg: boolean;
    isLaunched: boolean;
    organizerInfo?: OrganizerInfo;
    members: Member[];
    addFirst: string; setAddFirst: (v: string) => void;
    addLast: string;  setAddLast:  (v: string) => void;
    addEmail: string; setAddEmail: (v: string) => void;
    addPhone: string; setAddPhone: (v: string) => void;
    addingMember: boolean;
    onAddParticipant:    () => void;
    onRemoveParticipant: (id: string) => void;
    onImportParticipants?: (rows: CsvRow[]) => Promise<ImportResult>;
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
    addFirst, setAddFirst, addLast, setAddLast, addEmail, setAddEmail, addPhone, setAddPhone,
    addingMember, onAddParticipant, onRemoveParticipant, onImportParticipants,
    donors,
    dFirst, setDFirst, dLast, setDLast, dEmail, setDEmail, dPhone, setDPhone,
    addingDonor, onAddDonor, onRemoveDonor, onImportDonors,
}: Props) {
    const [expandedDonorId,   setExpandedDonorId]   = useState<string | null>(null);
    const [expandedMemberId,  setExpandedMemberId]  = useState<string | null>(null);
    const [showDonorCsv,      setShowDonorCsv]      = useState(false);
    const [showParticipantCsv, setShowParticipantCsv] = useState(false);
    const [allowPhotoUpload,  setAllowPhotoUpload]  = useState(false);

    const myselfAlreadyDonor = !!organizerInfo &&
        donors.some((d) => d.email?.toLowerCase() === organizerInfo.email?.toLowerCase());

    const participants = members.filter((m) => m.roles.some((r) => r.role === "participant"));

    return (
        <div className="space-y-0">

            {/* ── DONORS SECTION (individual only) ────────────────────── */}
            {!isOrg && (
                <>
                    <SubBanner
                        title="Add Donors"
                        subtitle="Reaching out to more donors will increase your campaign's success!"
                    />

                    <div className="pt-4 pb-6 space-y-3">

                        {isLaunched && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                <svg className="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Donor list is locked once the campaign is launched.
                            </div>
                        )}

                        {/* Donor card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 space-y-2">

                                {/* Saved donors */}
                                {donors.map((d, i) => (
                                    <SavedRow
                                        key={d.id}
                                        index={i + 1}
                                        name={`${d.first_name} ${d.last_name}`}
                                        contactInfo={[d.email, d.phone].filter(Boolean).join(" · ")}
                                        status="added"
                                        expanded={expandedDonorId === d.id}
                                        onToggle={() => setExpandedDonorId(expandedDonorId === d.id ? null : d.id)}
                                        onRemove={() => { onRemoveDonor(d.id); setExpandedDonorId(null); }}
                                        locked={isLaunched}
                                    />
                                ))}

                                {/* Add new donor form */}
                                {!isLaunched && (
                                    <AddForm
                                        index={donors.length + 1}
                                        label="Donor"
                                        first={dFirst} setFirst={setDFirst}
                                        last={dLast}   setLast={setDLast}
                                        email={dEmail} setEmail={setDEmail}
                                        phone={dPhone} setPhone={setDPhone}
                                        adding={addingDonor}
                                        onAdd={onAddDonor}
                                        myselfInfo={organizerInfo}
                                        myselfAlready={myselfAlreadyDonor}
                                    />
                                )}
                            </div>

                            {/* Add another button */}
                            {!isLaunched && (
                                <div className="px-4 pb-4">
                                    <button
                                        type="button"
                                        onClick={onAddDonor}
                                        disabled={addingDonor || !dFirst || !dLast}
                                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
                                    >
                                        {addingDonor ? "Adding…" : "+ Add Another Donor"}
                                    </button>

                                    {/* CSV link */}
                                    <p className="text-center text-xs text-gray-400 mt-2">
                                        Have a CSV file?{" "}
                                        <button type="button" onClick={() => setShowDonorCsv((v) => !v)}
                                            className="text-blue-600 hover:text-blue-700 font-semibold">
                                            Import now
                                        </button>
                                    </p>
                                    {showDonorCsv && onImportDonors && (
                                        <div className="mt-3">
                                            <CsvImporter type="donor" onImport={onImportDonors} onClose={() => setShowDonorCsv(false)} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <FundBuddyBar text="Ask FundBuddy for additional context on how to find and engage your best potential donors." />
                        </div>
                    </div>
                </>
            )}

            {/* ── PARTICIPANTS SECTION (org only) ─────────────────────── */}
            {isOrg && (
                <>
                    <SubBanner
                        title="Add Participants"
                        subtitle="Invite participants to boost your reach"
                    />

                    <div className="pt-4 pb-6 space-y-3">

                        {isLaunched && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                <svg className="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Participant list is locked once the campaign is launched.
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Photo upload toggle */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-700">Allow participants to upload profile photo?</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={allowPhotoUpload}
                                    onClick={() => setAllowPhotoUpload((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowPhotoUpload ? "bg-green-500" : "bg-gray-200"}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${allowPhotoUpload ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            <div className="p-4 space-y-2">
                                {/* Saved participants */}
                                {participants.map((m, i) => (
                                    <SavedRow
                                        key={m.id}
                                        index={i + 1}
                                        name={`${m.first_name} ${m.last_name}`}
                                        contactInfo={[m.email, m.phone].filter(Boolean).join(" · ")}
                                        status="pending"
                                        expanded={expandedMemberId === m.id}
                                        onToggle={() => setExpandedMemberId(expandedMemberId === m.id ? null : m.id)}
                                        onRemove={() => { onRemoveParticipant(m.id); setExpandedMemberId(null); }}
                                        locked={isLaunched}
                                    />
                                ))}

                                {/* Add new participant form */}
                                {!isLaunched && (
                                    <AddForm
                                        index={participants.length + 1}
                                        label="Participant"
                                        first={addFirst} setFirst={setAddFirst}
                                        last={addLast}   setLast={setAddLast}
                                        email={addEmail} setEmail={setAddEmail}
                                        phone={addPhone} setPhone={setAddPhone}
                                        adding={addingMember}
                                        onAdd={onAddParticipant}
                                        myselfInfo={organizerInfo}
                                    />
                                )}
                            </div>

                            {!isLaunched && (
                                <div className="px-4 pb-4">
                                    <button
                                        type="button"
                                        onClick={onAddParticipant}
                                        disabled={addingMember || !addFirst || !addLast}
                                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
                                    >
                                        {addingMember ? "Adding…" : "+ Add Another Participant"}
                                    </button>

                                    <p className="text-center text-xs text-gray-400 mt-2">
                                        Have a CSV file?{" "}
                                        <button type="button" onClick={() => setShowParticipantCsv((v) => !v)}
                                            className="text-blue-600 hover:text-blue-700 font-semibold">
                                            Import now
                                        </button>
                                    </p>
                                    {showParticipantCsv && onImportParticipants && (
                                        <div className="mt-3">
                                            <CsvImporter type="participant" onImport={onImportParticipants} onClose={() => setShowParticipantCsv(false)} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <FundBuddyBar text="Ask FundBuddy for additional context on how to recruit and motivate participants." />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
