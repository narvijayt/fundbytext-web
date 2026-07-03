"use client";

import { useState, useEffect, useRef } from "react";

const PASS_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*";

function generateStrongPassword(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => PASS_CHARS[b % PASS_CHARS.length]).join("");
}

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]";

export default function CreateUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [email,     setEmail]     = useState("");
    const [phone,     setPhone]     = useState("");
    const [password,  setPassword]  = useState("");
    const [role,      setRole]      = useState<"user" | "admin">("user");
    const [showPass,  setShowPass]  = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [shown,     setShown]     = useState(false);
    const firstRef = useRef<HTMLInputElement>(null);

    // Per-field validation errors
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?:  string;
        email?:     string;
        password?:  string;
        general?:   string;
    }>({});

    useEffect(() => {
        const raf = requestAnimationFrame(() => { setShown(true); firstRef.current?.focus(); });
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() { if (saving) return; setShown(false); window.setTimeout(onClose, 170); }

    function validate() {
        const e: typeof errors = {};
        if (!firstName.trim())           e.firstName = "First name is required.";
        if (!lastName.trim())            e.lastName  = "Last name is required.";
        if (!email.trim())               e.email     = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                         e.email     = "Enter a valid email address.";
        if (password && password.length < 8)
                                         e.password  = "Password must be at least 8 characters.";
        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const fieldErrors = validate();
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }
        setErrors({});
        setSaving(true);

        const res = await fetch("/api/v1/admin/users", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
                email:      email.trim(),
                phone:      phone.trim() || null,
                password:   password || null,
                role,
            }),
        });

        if (res.status === 201) {
            onSaved();
            setShown(false);
            window.setTimeout(onClose, 170);
        } else {
            const j = await res.json().catch(() => ({}));
            const msg = typeof j.error === "string" ? j.error : "Failed to create user.";
            // Surface duplicate-email error under the email field
            if (res.status === 409) {
                setErrors({ email: msg });
            } else {
                setErrors({ general: msg });
            }
            setSaving(false);
        }
    }

    function handleGenerate() {
        const pw = generateStrongPassword();
        setPassword(pw);
        setShowPass(true);
        setErrors((prev) => ({ ...prev, password: undefined }));
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-user-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="create-user-title" className="text-[16px] font-bold">Create New User</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>First Name</label>
                            <input
                                ref={firstRef}
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); }}
                                className={errors.firstName ? INPUT_ERR : INPUT}
                                placeholder="Jane"
                            />
                            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Last Name</label>
                            <input
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); }}
                                className={errors.lastName ? INPUT_ERR : INPUT}
                                placeholder="Smith"
                            />
                            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className={LABEL}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                                className={errors.email ? INPUT_ERR : INPUT}
                                placeholder="jane@example.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        <div>
                            <label className={LABEL}>Phone <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(optional)</span></label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={INPUT}
                                placeholder="(555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className={LABEL}>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} className={INPUT}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label className={`${LABEL} mb-0`}>
                                    Password <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(auto-generated if blank)</span>
                                </label>
                                <button type="button" onClick={handleGenerate} className="shrink-0 text-xs font-semibold text-[#0268c0] hover:underline">
                                    Generate
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                                    className={`${errors.password ? INPUT_ERR : INPUT} pr-11`}
                                    placeholder="Min. 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa7b8] transition-colors hover:text-[#003060]"
                                    tabIndex={-1}
                                    aria-label={showPass ? "Hide password" : "Show password"}
                                >
                                    {showPass ? (
                                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                        </div>

                        {errors.general && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{errors.general}</p>}
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                        <button type="button" onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                            {saving ? "Creating…" : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
