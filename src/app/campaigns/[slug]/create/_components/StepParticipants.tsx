"use client";

import { useRef, useState } from "react";
import { type Donor, type Member, type CsvRow, type ImportResult } from "./types";
import { QuestionCard, Loader } from "./ui";

// ── Field values shared by donor + participant edits ────────────────────────────
type PersonFieldsValue = {
    first_name: string;
    last_name:  string;
    email:      string | null;
    phone:      string | null;
};

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

// ── Icons (exact Figma exports, inlined for colour control) ─────────────────────

/* Blue "edit this person" icon — used as the row marker when profile-photo
   upload is disabled (and always for donors). */
function IconUserEdit({ className = "size-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#0268C0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" />
            <path d="M19.21 15.74L15.67 19.2801C15.53 19.4201 15.4 19.68 15.37 19.87L15.18 21.22C15.11 21.71 15.45 22.05 15.94 21.98L17.29 21.79C17.48 21.76 17.75 21.63 17.88 21.49L21.42 17.95C22.03 17.34 22.32 16.63 21.42 15.73C20.53 14.84 19.82 15.13 19.21 15.74Z" strokeMiterlimit={10} />
            <path d="M18.7 16.25C19 17.33 19.84 18.17 20.92 18.47" strokeMiterlimit={10} />
            <path d="M3.40997 22C3.40997 18.13 7.26 15 12 15C13.04 15 14.04 15.15 14.97 15.43" />
        </svg>
    );
}

/* Blue circle-plus — the avatar/upload affordance shown when participants are
   allowed to upload a profile photo. */
function IconCirclePlus({ className = "size-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#0268C0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 22.5857C17.8464 22.5857 22.5857 17.8464 22.5857 12C22.5857 6.15367 17.8464 1.41429 12 1.41429C6.15367 1.41429 1.41429 6.15367 1.41429 12C1.41429 17.8464 6.15367 22.5857 12 22.5857Z" />
            <path d="M12 7.11429V16.8857" />
            <path d="M7.11429 12H16.8857" />
        </svg>
    );
}

/* The 32×32 profile-photo slot shown to the left of each participant when
   photo upload is enabled. Empty → dashed box + circle-plus (click to pick);
   filled → the uploaded photo with a small remove (×) badge. Uploads the
   chosen file (parent does the actual upload) and shows a spinner meanwhile. */
function AvatarUpload({ url, uploading, readOnly, onPick, onRemove }: {
    url: string | null;
    uploading: boolean;
    readOnly?: boolean;
    onPick: (file: File) => void;
    onRemove?: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const filled = !!url && !uploading;
    return (
        <span className="relative inline-flex shrink-0">
            <button
                type="button"
                disabled={readOnly || uploading}
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                aria-label={url ? "Replace profile photo" : "Upload profile photo"}
                className={`flex size-8 items-center justify-center overflow-hidden rounded-md bg-[#f4f8f9] ${
                    filled ? "border border-[#d4dee7]" : "border border-dashed border-[rgba(2,120,222,0.3)]"
                } ${readOnly ? "cursor-default" : ""}`}
            >
                {uploading
                    ? <Loader className="size-4" />
                    : url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={url} alt="" className="size-full object-cover" />
                        : <IconCirclePlus className="size-6" />}
            </button>
            {filled && !readOnly && onRemove && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    aria-label="Remove profile photo"
                    className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-[#C9261D] text-white shadow"
                >
                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
            />
        </span>
    );
}

/* Green octagon + check — a saved row whose required fields are all present. */
function StatusValid({ className = "size-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="none" aria-label="Complete" role="img">
            <path d="M5.21225 0.285938C5.56601 0.195531 6.50431 0 8.00018 0C9.49584 0 10.4341 0.195475 10.788 0.285899C10.9349 0.323437 11.0657 0.383649 11.1813 0.455394C11.5434 0.680238 12.7624 1.46297 13.6112 2.3521C14.3709 3.14784 15.1827 4.24952 15.5113 4.70677C15.6699 4.92762 15.7706 5.18306 15.8054 5.4525C15.8695 5.94963 16.0001 7.07193 16 7.9993C15.9999 8.92646 15.8694 10.0492 15.8053 10.5466C15.7706 10.8162 15.6699 11.0718 15.5112 11.2928C15.1826 11.7502 14.3709 12.8517 13.6113 13.6473C12.767 14.5318 11.5566 15.3109 11.1875 15.5402C11.0674 15.6149 10.9315 15.6771 10.7794 15.7158C10.419 15.8071 9.48389 15.9994 8.00024 15.9994C6.51637 15.9994 5.58115 15.8071 5.22093 15.7157C5.06901 15.6771 4.93322 15.615 4.81317 15.5403C4.44427 15.3112 3.23361 14.5323 2.3892 13.6478C1.62953 12.852 0.817538 11.7499 0.489004 11.2926C0.330348 11.0718 0.229777 10.8163 0.195025 10.5469C0.130884 10.0497 0.00015675 8.92713 1.39383e-07 7.99982C-0.000155919 7.07223 0.130774 5.94935 0.195005 5.45222C0.22979 5.18297 0.330335 4.92769 0.488892 4.70696C0.817351 4.24971 1.62939 3.14752 2.38914 2.35163C3.23802 1.46238 4.45722 0.679901 4.81929 0.455233C4.93475 0.383586 5.06549 0.323446 5.21225 0.285938Z" fill="#26BA58" />
            <path d="M4.5 8L7 10.5L12 5.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* Red octagon + exclamation — a saved row missing a required field. */
function StatusError({ className = "size-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="none" aria-label="Missing information" role="img">
            <path fillRule="evenodd" clipRule="evenodd" d="M5.21225 0.285938C5.56601 0.195531 6.50431 0 8.00018 0C9.49584 0 10.4341 0.195475 10.788 0.285899C10.9349 0.323437 11.0657 0.383649 11.1813 0.455394C11.5434 0.680238 12.7624 1.46297 13.6112 2.3521C14.3709 3.14784 15.1827 4.24952 15.5113 4.70677C15.6699 4.92762 15.7706 5.18306 15.8054 5.4525C15.8695 5.94963 16.0001 7.07193 16 7.9993C15.9999 8.92646 15.8694 10.0492 15.8053 10.5466C15.7706 10.8162 15.6699 11.0718 15.5112 11.2928C15.1826 11.7502 14.3709 12.8517 13.6113 13.6473C12.767 14.5318 11.5566 15.3109 11.1875 15.5402C11.0674 15.6149 10.9315 15.6771 10.7794 15.7158C10.419 15.8071 9.48389 15.9994 8.00024 15.9994C6.51637 15.9994 5.58115 15.8071 5.22093 15.7157C5.06901 15.6771 4.93322 15.615 4.81317 15.5403C4.44427 15.3112 3.23361 14.5323 2.3892 13.6478C1.62953 12.852 0.817538 11.7499 0.489004 11.2926C0.330348 11.0718 0.229777 10.8163 0.195025 10.5469C0.130884 10.0497 0.00015675 8.92713 1.39383e-07 7.99982C-0.000155919 7.07223 0.130774 5.94935 0.195005 5.45222C0.22979 5.18297 0.330335 4.92769 0.488892 4.70696C0.817351 4.24971 1.62939 3.14752 2.38914 2.35163C3.23802 1.46238 4.45722 0.679901 4.81929 0.455233C4.93475 0.383586 5.06549 0.323446 5.21225 0.285938ZM8 3.6296C8.47338 3.6296 8.85714 4.01336 8.85714 4.48674V8.18927C8.85714 8.66265 8.47338 9.04641 8 9.04641C7.52662 9.04641 7.14286 8.66265 7.14286 8.18927V4.48674C7.14286 4.01336 7.52662 3.6296 8 3.6296ZM8 9.98563C8.47338 9.98563 8.85714 10.3694 8.85714 10.8428V11.5131C8.85714 11.9865 8.47338 12.3703 8 12.3703C7.52662 12.3703 7.14286 11.9865 7.14286 11.5131V10.8428C7.14286 10.3694 7.52662 9.98563 8 9.98563Z" fill="#C9261D" />
        </svg>
    );
}

/* Grey chevron — points right when collapsed, down when expanded. */
function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg className={`size-6 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="#AEB5BD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4.79083 8.50024L11.9978 15.5002L19.2092 8.50024" />
        </svg>
    );
}

function PlusIcon({ className = "size-[18px]" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function TrashIcon({ className = "size-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
        </svg>
    );
}

// ── Toggle ──────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, disabled }: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-center gap-6 rounded-2xl border border-[#eaeef3] bg-[#f4f8f9] p-6 ${disabled ? "opacity-60" : ""}`}
            style={{ boxShadow: "0px 20px 20px -14px rgba(2,104,192,0.2)" }}
        >
            <span className="flex-1 text-[15px] sm:text-[15px] font-medium leading-[1.4] text-[#57728d]">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60"
                style={{ background: checked
                    ? "linear-gradient(180deg, #34d56a 0%, #28c45d 100%)"
                    : "linear-gradient(180deg, #eaeef3 0%, #d4dee7 100%)" }}
            >
                <span
                    className="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white transition-[left]"
                    style={{ left: checked ? "22px" : "2px", boxShadow: "0px 2px 4px rgba(0,48,96,0.25)" }}
                />
            </button>
        </div>
    );
}

// ── Inputs ────────────────────────────────────────────────────────────────────

const fieldCls =
    "h-14 w-full rounded-xl border border-[#d4dee7] bg-white px-5 text-[15px] font-medium leading-[1.4] text-[#003060] placeholder:text-[#aeb5bd] focus:border-[#0278de] focus:outline-none disabled:bg-[#f4f8f9] disabled:text-[#8f98a3]";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex w-full flex-col gap-3">
            <span className="text-[12px] font-black uppercase leading-none tracking-[1px] text-[#003060]">{label}</span>
            {children}
        </div>
    );
}

function PhoneField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <div className={`flex h-14 w-full items-center gap-4 rounded-xl border border-[#d4dee7] px-5 ${disabled ? "bg-[#f4f8f9]" : "bg-white focus-within:border-[#0278de]"}`}>
            <span className="text-[15px] font-medium text-[#8f98a3]">+1</span>
            <span className="h-8 w-px shrink-0 bg-[#d4dee7]" />
            <input
                type="tel"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                placeholder="(214) 987-6543"
                className={`min-w-0 flex-1 bg-transparent text-[15px] font-medium placeholder:text-[#aeb5bd] focus:outline-none ${disabled ? "text-[#8f98a3]" : "text-[#003060]"}`}
            />
        </div>
    );
}

function PersonFields({
    nameLabel, first, last, email, phone,
    onFirst, onLast, onEmail, onPhone, disabled,
}: {
    nameLabel: string;
    first: string; last: string; email: string; phone: string;
    onFirst: (v: string) => void; onLast: (v: string) => void;
    onEmail: (v: string) => void; onPhone: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex w-full flex-col gap-6">
            <FieldGroup label={nameLabel}>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input className={fieldCls} placeholder="First Name" value={first} disabled={disabled} onChange={(e) => onFirst(e.target.value)} />
                    <input className={fieldCls} placeholder="Last Name"  value={last}  disabled={disabled} onChange={(e) => onLast(e.target.value)} />
                </div>
            </FieldGroup>
            <FieldGroup label="Phone">
                <PhoneField value={phone} onChange={onPhone} disabled={disabled} />
            </FieldGroup>
            <FieldGroup label="Email">
                <input type="email" className={fieldCls} placeholder="Enter a valid email address" value={email} disabled={disabled} onChange={(e) => onEmail(e.target.value)} />
            </FieldGroup>
        </div>
    );
}

// ── Row header (icon + "Label N (name)" + status + chevron) ──────────────────────

function RowHeader({
    leadingIcon, label, index, name, status, expanded, collapsible, onToggle, rightSlot,
}: {
    leadingIcon: React.ReactNode;
    label: string;
    index: number;
    name?: string;
    status?: "valid" | "error";
    expanded: boolean;
    collapsible: boolean;
    onToggle?: () => void;
    rightSlot?: React.ReactNode;
}) {
    // The leading icon stays OUTSIDE the toggle button — when it's an interactive
    // photo uploader it must not be nested inside another <button>.
    const body = (
        <>
            <span className="shrink-0 whitespace-nowrap text-[15px] sm:text-[18px] font-black leading-[1.25] text-[#0268c0]">
                {label} {index}
            </span>
            {name?.trim()
                ? <span className="min-w-0 flex-1 truncate text-[14px] sm:text-[15px] font-medium leading-[1.4] text-[#8f98a3]">({name})</span>
                : <span className="min-w-0 flex-1" />}
            {rightSlot}
            {status === "valid" && <StatusValid className="size-4 shrink-0" />}
            {status === "error" && <StatusError className="size-4 shrink-0" />}
            <ChevronIcon expanded={expanded} />
        </>
    );

    return (
        <div className="flex w-full items-center gap-2">
            {leadingIcon}
            {collapsible
                ? <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">{body}</button>
                : <div className="flex min-w-0 flex-1 items-center gap-2">{body}</div>}
        </div>
    );
}

function RowDivider() {
    return <div className="h-px w-full bg-[#eaeef3]" />;
}

// ── A saved (editable) donor / participant row ──────────────────────────────────

function SavedRow({
    label, nameLabel, index, photoOn, value, valid, expanded, locked,
    photoUrl, uploading, onPickPhoto, onRemovePhoto,
    onToggle, onField, onBlurSave, onRemove,
}: {
    label: string;
    nameLabel: string;
    index: number;
    photoOn: boolean;
    value: PersonFieldsValue;
    valid: boolean;
    expanded: boolean;
    locked: boolean;
    photoUrl?: string | null;
    uploading?: boolean;
    onPickPhoto?: (file: File) => void;
    onRemovePhoto?: () => void;
    onToggle: () => void;
    onField: (field: keyof PersonFieldsValue, v: string) => void;
    onBlurSave: () => void;
    onRemove: () => void;
}) {
    const name = `${value.first_name} ${value.last_name}`.trim();
    const leadingIcon = photoOn
        ? <AvatarUpload url={photoUrl ?? null} uploading={!!uploading} readOnly={locked} onPick={onPickPhoto ?? (() => {})} onRemove={onRemovePhoto} />
        : <IconUserEdit className="size-6" />;
    return (
        <div className="flex flex-col gap-6 rounded-xl p-4">
            <RowHeader
                leadingIcon={leadingIcon}
                label={label} index={index} name={name}
                status={valid ? "valid" : "error"}
                expanded={expanded} collapsible
                onToggle={onToggle}
            />
            {expanded && (
                <div
                    className="flex flex-col gap-6"
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlurSave(); }}
                >
                    <PersonFields
                        nameLabel={nameLabel}
                        first={value.first_name} last={value.last_name}
                        email={value.email ?? ""} phone={value.phone ?? ""}
                        onFirst={(v) => onField("first_name", v)}
                        onLast={(v) => onField("last_name", v)}
                        onEmail={(v) => onField("email", v)}
                        onPhone={(v) => onField("phone", v)}
                        disabled={locked}
                    />
                    {!valid && (
                        <p data-field-error className="text-[13px] font-medium text-[#C9261D]">
                            This {label.toLowerCase()} is missing required information.
                        </p>
                    )}
                    {!locked && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-[#C9261D] transition-opacity hover:opacity-70"
                        >
                            <TrashIcon className="size-4" />
                            Remove this {label.toLowerCase()}
                        </button>
                    )}
                </div>
            )}
            <RowDivider />
        </div>
    );
}

// ── The "add new" row (always expanded) ─────────────────────────────────────────

function AddRow({
    label, nameLabel, index, photoOn,
    first, last, email, phone,
    setFirst, setLast, setEmail, setPhone,
    photoUrl, uploading, onPickPhoto, onRemovePhoto,
    addMyself,
}: {
    label: string;
    nameLabel: string;
    index: number;
    photoOn: boolean;
    first: string; last: string; email: string; phone: string;
    setFirst: (v: string) => void; setLast: (v: string) => void;
    setEmail: (v: string) => void; setPhone: (v: string) => void;
    photoUrl?: string | null;
    uploading?: boolean;
    onPickPhoto?: (file: File) => void;
    onRemovePhoto?: () => void;
    addMyself?: () => void;
}) {
    const leadingIcon = photoOn
        ? <AvatarUpload url={photoUrl ?? null} uploading={!!uploading} onPick={onPickPhoto ?? (() => {})} onRemove={onRemovePhoto} />
        : <IconUserEdit className="size-6" />;
    return (
        <div className="flex flex-col gap-6 rounded-xl p-4">
            <RowHeader
                leadingIcon={leadingIcon}
                label={label} index={index}
                expanded collapsible={false}
                rightSlot={addMyself && (
                    <button
                        type="button"
                        onClick={addMyself}
                        className="shrink-0 rounded-full bg-[#eef5fd] px-3 py-1 text-[12px] font-semibold text-[#0268c0] transition-colors hover:bg-[#dcecfb]"
                    >
                        Add myself
                    </button>
                )}
            />
            <PersonFields
                nameLabel={nameLabel}
                first={first} last={last} email={email} phone={phone}
                onFirst={setFirst} onLast={setLast} onEmail={setEmail} onPhone={setPhone}
            />
            <RowDivider />
        </div>
    );
}

// ── CsvImporter (compact utility, revealed behind "Import now") ──────────────────

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

    const itemLabel = type === "donor" ? "donor" : "participant";

    return (
        <div className="space-y-3 rounded-xl border border-dashed border-[#d4dee7] bg-[#f4f8f9] p-4">
            <div className="flex items-center justify-between">
                <p className="text-[12px] font-black uppercase tracking-[1px] text-[#003060]">Import from CSV</p>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => downloadSample(type)} className="text-[12px] font-semibold text-[#0268c0] hover:opacity-70">
                        Sample CSV
                    </button>
                    <button type="button" onClick={onClose} className="text-[12px] text-[#8f98a3] hover:text-[#57728d]">
                        Close
                    </button>
                </div>
            </div>

            {result && (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <p className="text-[12px] text-green-700">
                        <span className="font-semibold">{result.added}</span> {itemLabel}{result.added !== 1 ? "s" : ""} added
                        {result.skipped > 0 && <span className="text-green-600"> · {result.skipped} skipped</span>}
                    </p>
                    <button type="button" onClick={() => setResult(null)} className="ml-3 text-[12px] font-medium text-green-600">Import more</button>
                </div>
            )}
            {error && !rows && <p className="px-1 text-[12px] text-[#C9261D]">{error}</p>}
            {rows && !importing && (
                <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[12px] text-[#57728d]">
                        <span className="font-semibold">{rows.length}</span> {itemLabel}{rows.length !== 1 ? "s" : ""} found
                        <span className="text-[#aeb5bd]"> · {fileName}</span>
                    </p>
                    <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setRows(null)} className="text-[12px] text-[#8f98a3] hover:text-[#57728d]">Cancel</button>
                        <button type="button" onClick={runImport} className="rounded-lg bg-[#0268c0] px-3 py-1.5 text-[12px] font-semibold text-white hover:brightness-110">
                            Import {rows.length}
                        </button>
                    </div>
                </div>
            )}
            {importing && (
                <div className="flex items-center gap-2 text-[12px] text-[#8f98a3]">
                    <svg className="size-3.5 animate-spin text-[#aeb5bd]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Importing…
                </div>
            )}
            {!rows && !importing && !error && !result && (
                <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d4dee7] py-2 text-[14px] text-[#8f98a3] transition-colors hover:border-[#aeb5bd] hover:text-[#57728d]">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

// ── Add button + CSV link ─────────────────────────────────────────────────────

function AddButton({ label, adding, disabled, onClick }: {
    label: string; adding: boolean; disabled: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-4 rounded-2xl bg-[#f47435] px-[18px] pb-[22px] pt-5 text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
            style={{ boxShadow: "0px 20px 20px -14px rgba(234,103,37,0.2), 0px 20px 40px -16px rgba(244,116,53,0.2)" }}
        >
            <PlusIcon className="size-[18px]" />
            <span className="text-[12px] font-black uppercase leading-none tracking-[1px]">
                {adding ? "Adding…" : `Add Another ${label}`}
            </span>
        </button>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type OrganizerInfo = { first_name: string; last_name: string; email: string; phone: string };

type Props = {
    isOrg: boolean;
    isLaunched: boolean;
    organizerInfo?: OrganizerInfo;
    allowParticipantPhoto: boolean;
    onToggleAllowPhoto: (next: boolean) => void;
    onUploadProfilePhoto: (file: File) => Promise<string | null>;

    members: Member[];
    addFirst: string; setAddFirst: (v: string) => void;
    addLast: string;  setAddLast:  (v: string) => void;
    addEmail: string; setAddEmail: (v: string) => void;
    addPhone: string; setAddPhone: (v: string) => void;
    addPhotoUrl: string | null; setAddPhotoUrl: (v: string | null) => void;
    addingMember: boolean;
    onAddParticipant:    () => void;
    onRemoveParticipant: (id: string) => void;
    onImportParticipants?: (rows: CsvRow[]) => Promise<ImportResult>;
    onEditParticipant:   (id: string, field: keyof PersonFieldsValue, value: string) => void;
    onSaveParticipant:   (id: string, fields: PersonFieldsValue) => void;
    onSetParticipantPhoto: (id: string, url: string | null) => void;

    donors: Donor[];
    dFirst: string; setDFirst: (v: string) => void;
    dLast: string;  setDLast:  (v: string) => void;
    dEmail: string; setDEmail: (v: string) => void;
    dPhone: string; setDPhone: (v: string) => void;
    addingDonor: boolean;
    onAddDonor:    () => void;
    onRemoveDonor: (id: string) => void;
    onImportDonors?: (rows: CsvRow[]) => Promise<ImportResult>;
    onEditDonor:   (id: string, field: keyof PersonFieldsValue, value: string) => void;
    onSaveDonor:   (id: string, fields: PersonFieldsValue) => void;
};

// ── Validity ────────────────────────────────────────────────────────────────────

// Donors require a name + email; participants require a name + email OR phone.
const donorValid = (d: { first_name: string; last_name: string; email: string | null }) =>
    !!(d.first_name?.trim() && d.last_name?.trim() && d.email?.trim());
const participantValid = (m: { first_name: string; last_name: string; email: string | null; phone: string | null }) =>
    !!(m.first_name?.trim() && m.last_name?.trim() && (m.email?.trim() || m.phone?.trim()));

// ── Component ─────────────────────────────────────────────────────────────────

export default function StepParticipants({
    isOrg, isLaunched, organizerInfo,
    allowParticipantPhoto, onToggleAllowPhoto, onUploadProfilePhoto,
    members,
    addFirst, setAddFirst, addLast, setAddLast, addEmail, setAddEmail, addPhone, setAddPhone,
    addPhotoUrl, setAddPhotoUrl,
    addingMember, onAddParticipant, onRemoveParticipant, onImportParticipants, onEditParticipant, onSaveParticipant,
    onSetParticipantPhoto,
    donors,
    dFirst, setDFirst, dLast, setDLast, dEmail, setDEmail, dPhone, setDPhone,
    addingDonor, onAddDonor, onRemoveDonor, onImportDonors, onEditDonor, onSaveDonor,
}: Props) {
    const [expandedId,         setExpandedId]         = useState<string | null>(null);
    const [showDonorCsv,       setShowDonorCsv]       = useState(false);
    const [showParticipantCsv, setShowParticipantCsv] = useState(false);
    const [uploadingKey,       setUploadingKey]       = useState<string | null>(null);

    // Upload a chosen file, then hand the resulting URL to `apply`. `key`
    // identifies which avatar slot is busy so only that one shows a spinner.
    async function pickPhoto(file: File, key: string, apply: (url: string) => void) {
        setUploadingKey(key);
        const url = await onUploadProfilePhoto(file);
        if (url) apply(url);
        setUploadingKey(null);
    }

    const myselfAlreadyDonor = !!organizerInfo &&
        donors.some((d) => d.email?.toLowerCase() === organizerInfo.email?.toLowerCase());
    const participants = members.filter((m) => m.roles.some((r) => r.role === "participant"));
    const myselfAlreadyParticipant = !!organizerInfo &&
        participants.some((m) => m.email?.toLowerCase() === organizerInfo.email?.toLowerCase());

    const askBuddySuggestions = isOrg
        ? [
            "How do I recruit and motivate participants?",
            "What's the ideal number of participants for my goal?",
            "How can participants reach more donors?",
        ]
        : [
            "How do I find and engage my best potential donors?",
            "What's the best way to ask for a donation?",
            "How many donors should I invite?",
        ];

    return (
        <QuestionCard
            askBuddyText="Ask FundBuddy for additional context"
            askBuddySuggestionsHeading={isOrg ? "Recruiting participants" : "Reaching your donors"}
            askBuddySuggestions={askBuddySuggestions}
        >
            <div className="flex flex-col gap-8">

                {/* Photo-upload permission — org / participant campaigns only */}
                {isOrg && (
                    <Toggle
                        label="Allow participants to upload profile photo?"
                        checked={allowParticipantPhoto}
                        onChange={onToggleAllowPhoto}
                        disabled={isLaunched}
                    />
                )}

                {isLaunched && (
                    <p className="text-center text-[13px] font-medium text-[#8f98a3]">
                        The {isOrg ? "participant" : "donor"} list is locked once the campaign is launched.
                    </p>
                )}

                {/* Rows */}
                <div className="flex flex-col gap-2">
                    {isOrg
                        ? participants.map((m, i) => (
                            <SavedRow
                                key={m.id}
                                label="Participant" nameLabel="Participant Name"
                                index={i + 1}
                                photoOn={allowParticipantPhoto}
                                photoUrl={m.profile_photo_url}
                                uploading={uploadingKey === m.id}
                                onPickPhoto={(f) => pickPhoto(f, m.id, (url) => onSetParticipantPhoto(m.id, url))}
                                onRemovePhoto={() => onSetParticipantPhoto(m.id, null)}
                                value={{ first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone }}
                                valid={participantValid(m)}
                                expanded={expandedId === m.id}
                                locked={isLaunched}
                                onToggle={() => {
                                    const closing = expandedId === m.id;
                                    setExpandedId(closing ? null : m.id);
                                    if (closing && participantValid(m)) {
                                        onSaveParticipant(m.id, { first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone });
                                    }
                                }}
                                onField={(field, v) => onEditParticipant(m.id, field, v)}
                                onBlurSave={() => { if (participantValid(m)) onSaveParticipant(m.id, { first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone }); }}
                                onRemove={() => { onRemoveParticipant(m.id); setExpandedId(null); }}
                            />
                        ))
                        : donors.map((d, i) => (
                            <SavedRow
                                key={d.id}
                                label="Donor" nameLabel="Contact Name"
                                index={i + 1}
                                photoOn={false}
                                value={{ first_name: d.first_name, last_name: d.last_name, email: d.email, phone: d.phone }}
                                valid={donorValid(d)}
                                expanded={expandedId === d.id}
                                locked={isLaunched}
                                onToggle={() => {
                                    const closing = expandedId === d.id;
                                    setExpandedId(closing ? null : d.id);
                                    if (closing && donorValid(d)) {
                                        onSaveDonor(d.id, { first_name: d.first_name, last_name: d.last_name, email: d.email, phone: d.phone });
                                    }
                                }}
                                onField={(field, v) => onEditDonor(d.id, field, v)}
                                onBlurSave={() => { if (donorValid(d)) onSaveDonor(d.id, { first_name: d.first_name, last_name: d.last_name, email: d.email, phone: d.phone }); }}
                                onRemove={() => { onRemoveDonor(d.id); setExpandedId(null); }}
                            />
                        ))}

                    {/* Add-new form */}
                    {!isLaunched && (isOrg ? (
                        <AddRow
                            label="Participant" nameLabel="Participant Name"
                            index={participants.length + 1}
                            photoOn={allowParticipantPhoto}
                            photoUrl={addPhotoUrl}
                            uploading={uploadingKey === "add"}
                            onPickPhoto={(f) => pickPhoto(f, "add", setAddPhotoUrl)}
                            onRemovePhoto={() => setAddPhotoUrl(null)}
                            first={addFirst} last={addLast} email={addEmail} phone={addPhone}
                            setFirst={setAddFirst} setLast={setAddLast} setEmail={setAddEmail} setPhone={setAddPhone}
                            addMyself={organizerInfo && !myselfAlreadyParticipant && !addFirst && !addLast && !addEmail && !addPhone
                                ? () => { setAddFirst(organizerInfo.first_name); setAddLast(organizerInfo.last_name); setAddEmail(organizerInfo.email); setAddPhone(organizerInfo.phone); }
                                : undefined}
                        />
                    ) : (
                        <AddRow
                            label="Donor" nameLabel="Contact Name"
                            index={donors.length + 1}
                            photoOn={false}
                            first={dFirst} last={dLast} email={dEmail} phone={dPhone}
                            setFirst={setDFirst} setLast={setDLast} setEmail={setDEmail} setPhone={setDPhone}
                            addMyself={organizerInfo && !myselfAlreadyDonor && !dFirst && !dLast && !dEmail && !dPhone
                                ? () => { setDFirst(organizerInfo.first_name); setDLast(organizerInfo.last_name); setDEmail(organizerInfo.email); setDPhone(organizerInfo.phone); }
                                : undefined}
                        />
                    ))}
                </div>

                {/* Add button + CSV import */}
                {!isLaunched && (
                    <div className="flex flex-col gap-6">
                        {isOrg ? (
                            <AddButton label="Participant" adding={addingMember} disabled={addingMember} onClick={onAddParticipant} />
                        ) : (
                            <AddButton label="Donor" adding={addingDonor} disabled={addingDonor} onClick={onAddDonor} />
                        )}

                        <p className="text-center text-[15px] sm:text-[14px] font-medium text-[#003060]">
                            Have a CSV file?{" "}
                            <button
                                type="button"
                                onClick={() => (isOrg ? setShowParticipantCsv((v) => !v) : setShowDonorCsv((v) => !v))}
                                className="font-bold text-[#0268c0] underline"
                            >
                                Import now
                            </button>
                        </p>

                        {!isOrg && showDonorCsv && onImportDonors && (
                            <CsvImporter type="donor" onImport={onImportDonors} onClose={() => setShowDonorCsv(false)} />
                        )}
                        {isOrg && showParticipantCsv && onImportParticipants && (
                            <CsvImporter type="participant" onImport={onImportParticipants} onClose={() => setShowParticipantCsv(false)} />
                        )}
                    </div>
                )}
            </div>
        </QuestionCard>
    );
}
