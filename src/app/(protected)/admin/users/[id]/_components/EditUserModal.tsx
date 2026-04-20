"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PASS_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*";

function generateStrongPassword(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => PASS_CHARS[b % PASS_CHARS.length]).join("");
}

interface Props {
    userId:    string;
    isSelf:    boolean;
    initial: {
        first_name: string;
        last_name:  string;
        email:      string;
        username:   string | null;
        phone:      string | null;
        role:       "user" | "admin";
    };
    onClose:   () => void;
    onSaved:   () => void;
}

export default function EditUserModal({ userId, isSelf, initial, onClose, onSaved }: Props) {
    // For an admin editing their own account: email/phone/password are editable, role is locked.
    // For a non-admin: everything including role is editable.
    const isAdminAccount = initial.role === "admin";
    const router = useRouter();

    const [firstName, setFirstName] = useState(initial.first_name);
    const [lastName,  setLastName]  = useState(initial.last_name);
    const [email,     setEmail]     = useState(initial.email);
    const [username,  setUsername]  = useState(initial.username ?? "");
    const [phone,     setPhone]     = useState(initial.phone ?? "");
    const [role,      setRole]      = useState<"user" | "admin">(initial.role);
    const [password,  setPassword]  = useState("");
    const [showPass,  setShowPass]  = useState(false);
    const [saving,    setSaving]    = useState(false);

    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?:  string;
        email?:     string;
        username?:  string;
        password?:  string;
        general?:   string;
    }>({});

    const INPUT = "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0268c0]/40";

    function validate() {
        const e: typeof errors = {};
        if (!firstName.trim())          e.firstName = "First name is required.";
        if (!lastName.trim())           e.lastName  = "Last name is required.";
        if (!email.trim())              e.email     = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                        e.email     = "Enter a valid email address.";
        if (username && !/^[a-z0-9_.]+$/.test(username))
                                        e.username  = "Only lowercase letters, numbers, dots, and underscores allowed.";
        if (password && password.length < 8)
                                        e.password  = "Password must be at least 8 characters.";
        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const fieldErrors = validate();
        if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
        setErrors({});
        setSaving(true);

        const res = await fetch(`/api/v1/admin/users/${userId}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action:     "edit",
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
                email:      email.trim(),
                username:   username.trim() || null,
                phone:      phone.trim() || null,
                role,
                password:   password || null,
            }),
        });

        if (res.ok) {
            router.refresh();
            onSaved();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            const msg = typeof j.error === "string" ? j.error : "Failed to save changes.";
            if (res.status === 409 && msg.toLowerCase().includes("username")) setErrors({ username: msg });
            else if (res.status === 409) setErrors({ email: msg });
            else                         setErrors({ general: msg });
        }
        setSaving(false);
    }

    function handleGenerate() {
        setPassword(generateStrongPassword());
        setShowPass(true);
        setErrors((p) => ({ ...p, password: undefined }));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100vh-2rem)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900">Edit User</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Role is always locked for admin accounts */}
                    {isAdminAccount && (
                        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-amber-700 leading-snug">
                                {isSelf
                                    ? "You are editing your own admin account. Role cannot be changed."
                                    : "Only the name can be edited for admin accounts. Email, phone, password, and role are locked."}
                            </p>
                        </div>
                    )}
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

                    {!isAdminAccount && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">@</span>
                                <input
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value.toLowerCase()); setErrors((p) => ({ ...p, username: undefined })); }}
                                    className={`${INPUT} pl-7 ${errors.username ? "border-red-300" : "border-gray-200"}`}
                                    placeholder="john.smith"
                                    maxLength={30}
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                        {isAdminAccount && !isSelf ? (
                            <div className={`${INPUT} border-gray-200 bg-gray-50 text-gray-400 flex items-center justify-between`}>
                                <span className="truncate">{email}</span>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 ml-2">Locked</span>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                                    className={`${INPUT} ${errors.email ? "border-red-300" : "border-gray-200"}`}
                                    placeholder="jane@example.com"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                        {isAdminAccount && !isSelf ? (
                            <div className={`${INPUT} border-gray-200 bg-gray-50 text-gray-400 flex items-center justify-between`}>
                                <span>{phone || "—"}</span>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 ml-2">Locked</span>
                            </div>
                        ) : (
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={`${INPUT} border-gray-200`}
                                placeholder="(555) 000-0000"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                        {isAdminAccount ? (
                            <div className={`${INPUT} border-gray-200 bg-gray-50 text-gray-400 flex items-center justify-between`}>
                                <span>Admin</span>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Role locked</span>
                            </div>
                        ) : (
                            <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} className={`${INPUT} border-gray-200`}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                    </div>

                    <div>
                        {isAdminAccount && !isSelf ? (
                            <>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
                                <div className={`${INPUT} border-gray-200 bg-gray-50 text-gray-400 flex items-center justify-between`}>
                                    <span>••••••••••••</span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 ml-2">Locked</span>
                                </div>
                            </>
                        ) : (
                        <>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-gray-500">
                                New Password
                                <span className="ml-1 font-normal text-gray-400">(leave blank to keep unchanged)</span>
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
                        </>
                        )}
                    </div>

                    {errors.general && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.general}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#0268c0] hover:bg-[#0268c0]/90 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
