"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PASS_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*";

function generateStrongPassword(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => PASS_CHARS[b % PASS_CHARS.length]).join("");
}

export default function CreateUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [email,     setEmail]     = useState("");
    const [phone,     setPhone]     = useState("");
    const [password,  setPassword]  = useState("");
    const [role,      setRole]      = useState<"user" | "admin">("user");
    const [showPass,  setShowPass]  = useState(false);
    const [saving,    setSaving]    = useState(false);

    // Per-field validation errors
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?:  string;
        email?:     string;
        password?:  string;
        general?:   string;
    }>({});

    const INPUT = "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0268c0]/40";

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
            router.refresh();
            onSaved();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            const msg = typeof j.error === "string" ? j.error : "Failed to create user.";
            // Surface duplicate-email error under the email field
            if (res.status === 409) {
                setErrors({ email: msg });
            } else {
                setErrors({ general: msg });
            }
        }
        setSaving(false);
    }

    function handleGenerate() {
        const pw = generateStrongPassword();
        setPassword(pw);
        setShowPass(true);
        setErrors((prev) => ({ ...prev, password: undefined }));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100vh-2rem)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900">Create New User</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">First Name *</label>
                            <input
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); }}
                                className={`${INPUT} ${errors.firstName ? "border-red-300" : "border-gray-200"}`}
                                placeholder="Jane"
                            />
                            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name *</label>
                            <input
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); }}
                                className={`${INPUT} ${errors.lastName ? "border-red-300" : "border-gray-200"}`}
                                placeholder="Smith"
                            />
                            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                            className={`${INPUT} ${errors.email ? "border-red-300" : "border-gray-200"}`}
                            placeholder="jane@example.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`${INPUT} border-gray-200`}
                            placeholder="(555) 000-0000"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-gray-500">
                                Password
                                <span className="ml-1 font-normal text-gray-400">(leave blank to auto-generate)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="text-xs font-semibold text-[#0268c0] hover:underline"
                            >
                                Generate strong password
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                                className={`${INPUT} pr-10 ${errors.password ? "border-red-300" : "border-gray-200"}`}
                                placeholder="Min. 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                            >
                                {showPass ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} className={`${INPUT} border-gray-200`}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {errors.general && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.general}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#0268c0] hover:bg-[#0268c0]/90 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                            {saving ? "Creating…" : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
