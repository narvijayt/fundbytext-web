"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────
type EditingField = "name" | "email" | "phone" | null;

type FormState = {
    first_name: string;
    last_name: string;
    email: string;
    confirm_email: string;
    phone: string;
};

// ─── Page (fetches user on mount) ────────────────────────────
import { useEffect } from "react";

export default function EditProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        profile_photo_url: string | null;
    } | null>(null);

    useEffect(() => {
        fetch("/api/v1/user/me")
            .then((r) => r.json())
            .then((d) => setUser(d.user));
    }, []);

    if (!user) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
            <EditProfileForm user={user} onSaved={(u) => { setUser(u); router.refresh(); }} />
        </div>
    );
}

// ─── Form ─────────────────────────────────────────────────────
function EditProfileForm({
    user,
    onSaved,
}: {
    user: { first_name: string; last_name: string; email: string; phone: string | null; profile_photo_url: string | null };
    onSaved: (u: typeof user) => void;
}) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState<EditingField>(null);
    const [imgError, setImgError] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<FormState>({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        confirm_email: "",
        phone: user.phone ?? "",
    });

    function set(key: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
        setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) { setServerError("Only JPEG, PNG, WebP, or GIF allowed"); return; }
        if (file.size > 5 * 1024 * 1024) { setServerError("File must be under 5MB"); return; }
        setPhotoFile(file);
        setPreview(URL.createObjectURL(file));
        setImgError(false);
        setServerError(null);
    }

    function validate(): boolean {
        const errors: Record<string, string> = {};

        if (!form.first_name.trim()) errors.first_name = "Required";
        if (!form.last_name.trim()) errors.last_name = "Required";

        if (editing === "email") {
            if (!form.email) { errors.email = "Required"; }
            else if (!z.email().safeParse(form.email).success) { errors.email = "Invalid email"; }
            if (form.email !== form.confirm_email) errors.confirm_email = "Emails do not match";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        setServerError(null);

        let profile_photo_url = user.profile_photo_url;

        // Upload new photo if selected
        if (photoFile) {
            const fd = new globalThis.FormData();
            fd.append("photo", photoFile);
            const uploadRes = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            if (!uploadRes.ok) {
                const j = await uploadRes.json();
                setServerError(j.error ?? "Photo upload failed");
                setSaving(false);
                return;
            }
            const { url } = await uploadRes.json();
            profile_photo_url = url;
        }

        const payload: Record<string, unknown> = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone: form.phone.trim() || null,
            profile_photo_url,
        };
        if (editing === "email") payload.email = form.email;

        const res = await fetch("/api/v1/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setSaving(false);

        if (!res.ok) {
            const j = await res.json();
            setServerError(j.error ?? "Failed to save");
            return;
        }

        const { user: updated } = await res.json();
        onSaved(updated);
        setEditing(null);
        setPhotoFile(null);
        setPreview(null);
    }

    const photoSrc = preview ?? user.profile_photo_url;
    const displayName = `${user.first_name} ${user.last_name}`;

    return (
        <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-blue-600 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                <h1 className="text-base font-semibold">Edit Profile</h1>
                <button onClick={() => router.back()} className="text-white/80 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="bg-white rounded-b-2xl shadow-lg px-6 py-6 space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                        {photoSrc && !imgError ? (
                            <Image
                                src={photoSrc}
                                alt={displayName}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className="text-2xl font-bold text-orange-500">
                                {user.first_name[0]?.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Change Profile Picture</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                            Upload
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handlePhotoChange}
                    />
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</label>
                    {editing === "name" ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    value={form.first_name}
                                    onChange={(e) => set("first_name", e.target.value)}
                                    placeholder="First Name"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                {fieldErrors.first_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.first_name}</p>}
                            </div>
                            <div>
                                <input
                                    value={form.last_name}
                                    onChange={(e) => set("last_name", e.target.value)}
                                    placeholder="Last Name"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                {fieldErrors.last_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.last_name}</p>}
                            </div>
                        </div>
                    ) : (
                        <FieldDisplay
                            value={`${form.first_name} ${form.last_name}`}
                            onEdit={() => setEditing("name")}
                        />
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
                    {editing === "email" ? (
                        <div className="space-y-2">
                            <div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => set("email", e.target.value)}
                                    placeholder="Enter a valid email address"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirm Email Address</label>
                                <input
                                    type="email"
                                    value={form.confirm_email}
                                    onChange={(e) => set("confirm_email", e.target.value)}
                                    placeholder="Confirm valid email address"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                {fieldErrors.confirm_email && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm_email}</p>}
                            </div>
                        </div>
                    ) : (
                        <FieldDisplay value={form.email} onEdit={() => { set("confirm_email", ""); setEditing("email"); }} />
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                    {editing === "phone" ? (
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                            <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 shrink-0">+1</span>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                placeholder="(214) 987-6543"
                                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                            />
                        </div>
                    ) : (
                        <FieldDisplay
                            value={form.phone ? `+1 ${form.phone}` : "—"}
                            onEdit={() => setEditing("phone")}
                        />
                    )}
                </div>

                {serverError && <p className="text-sm text-red-500">{serverError}</p>}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => router.back()}
                        className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Field Display Row ────────────────────────────────────────
function FieldDisplay({ value, onEdit }: { value: string; onEdit: () => void }) {
    return (
        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
            <span className="text-sm text-gray-700">{value}</span>
            <button
                onClick={onEdit}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors ml-3 shrink-0"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
            </button>
        </div>
    );
}
