"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Loader } from "./ui";

/* Shimmering skeleton placeholder shown while a photo is still loading. */
function Skeleton() {
    return (
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#eaeef3]">
            <div
                className="absolute inset-0 -translate-x-full"
                style={{
                    animation: "shimmer 1.4s infinite",
                    backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
                }}
            />
        </div>
    );
}

/* Action menu shown when the edit badge is clicked — portal'd so the card's
   overflow-hidden can't clip it. */
function EditMenu({
    anchorRef, canRemove, onUploadNew, onRemove, onClose,
}: {
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    canRemove: boolean;
    onUploadNew: () => void;
    onRemove: () => void;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        function update() {
            const a = anchorRef.current;
            if (a) setRect(a.getBoundingClientRect());
        }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [anchorRef]);

    useLayoutEffect(() => {
        const el = menuRef.current;
        if (!rect || !el) return;
        const margin = 8, gap = 6, w = el.offsetWidth, h = el.offsetHeight;
        let left = rect.right - w;
        left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
        let top = rect.bottom + gap;
        if (top + h > window.innerHeight - margin) top = rect.top - gap - h;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.visibility = "visible";
    });

    useEffect(() => {
        function onDown(e: MouseEvent) {
            const a = anchorRef.current, el = menuRef.current;
            if (el && !el.contains(e.target as Node) && a && !a.contains(e.target as Node)) onClose();
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [anchorRef, onClose]);

    if (typeof document === "undefined" || !rect) return null;

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            className="fixed z-[210] min-w-[176px] overflow-hidden rounded-xl bg-white py-1.5"
            style={{ top: 0, left: 0, visibility: "hidden", boxShadow: "0px 16px 32px -8px rgba(0,48,96,0.28), 0px 4px 8px -4px rgba(0,48,96,0.18)" }}
        >
            <button
                type="button"
                role="menuitem"
                onClick={onUploadNew}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium text-[#003060] hover:bg-[#f4f8f9]"
            >
                <svg className="w-4 h-4 text-[#0268c0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V6m0 0L8 10m4-4l4 4" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Upload a new photo
            </button>
            {canRemove && (
                <button
                    type="button"
                    role="menuitem"
                    onClick={onRemove}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium text-[#e2483d] hover:bg-[#fdf2f1]"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
                    </svg>
                    Remove photo
                </button>
            )}
        </div>,
        document.body,
    );
}

export default function UploadBox({
    url,
    type,
    uploadKey,
    onUploaded,
    onRemoved,
    className = "",
    uploadingPhoto,
    uploadPhoto,
}: {
    url: string | null;
    type: string;
    /* Distinct spinner identity — defaults to `type`. Gallery slots all share
       the "gallery" type but pass a unique key so only the picked box spins. */
    uploadKey?: string;
    onUploaded: (url: string) => void;
    onRemoved?: () => void;
    className?: string;
    uploadingPhoto: string | null;
    uploadPhoto: (file: File, type: string, key?: string) => Promise<string | null>;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const badgeRef = useRef<HTMLButtonElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    // Track which url has finished loading — deriving `imgLoaded` from it means
    // the skeleton automatically re-shows when the url changes (no effect needed).
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const imgLoaded = !!url && loadedUrl === url;
    const key = uploadKey ?? type;
    const uploading = uploadingPhoto === key;

    async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploaded = await uploadPhoto(file, type, key);
        if (uploaded) onUploaded(uploaded);
        e.target.value = "";
    }

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onPick}
            />

            {uploading ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#f4f8f9] border-2 border-dashed border-[#d4dee7]">
                    <Loader className="w-9 h-9 sm:w-10 sm:h-10" />
                </div>
            ) : url ? (
                <>
                    {/* Skeleton sits BEHIND the image as a placeholder. The image
                    renders on top at full opacity, so it appears the instant the
                    browser can paint it (and immediately for cached/CDN photos via
                    the ref check) — no waiting for a full-load fade, which made the
                    card look half-finished while photos streamed in. */}
                    {!imgLoaded && <Skeleton />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={(el) => { if (el && el.complete && el.naturalWidth > 0 && loadedUrl !== url) setLoadedUrl(url); }}
                        src={url}
                        alt=""
                        decoding="async"
                        fetchPriority="high"
                        onLoad={() => setLoadedUrl(url)}
                        onError={() => setLoadedUrl(url)}
                        className="relative z-[1] h-full w-full rounded-xl object-cover"
                    />
                    <button
                        ref={badgeRef}
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Edit photo"
                        className={`absolute top-0 right-0 z-10 h-9 w-9 sm:h-10 sm:w-10 transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                        <span
                            aria-hidden
                            className="absolute top-0 right-0 h-full w-full rounded-tr-xl"
                            style={{ background: "#0268C0", clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                        />
                        <Image
                            src="/assets/campaigns/edit-pencil.svg"
                            width={16}
                            height={16}
                            alt=""
                            className="absolute top-1.5 right-1.5 w-3.5 h-3.5"
                        />
                    </button>
                    {menuOpen && (
                        <EditMenu
                            anchorRef={badgeRef}
                            canRemove={!!onRemoved}
                            onUploadNew={() => { setMenuOpen(false); inputRef.current?.click(); }}
                            onRemove={() => { setMenuOpen(false); onRemoved?.(); }}
                            onClose={() => setMenuOpen(false)}
                        />
                    )}
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="group flex h-full w-full flex-col items-center justify-center rounded-xl bg-[#f4f8f9] border-2 border-dashed border-[#d4dee7] transition-colors hover:border-[#0268c0]"
                >
                    <span className="flex items-center justify-center rounded-full border-2 border-[#0268c0] text-[#0268c0] transition-transform group-hover:scale-105 w-9 h-9 sm:w-10 sm:h-10">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </span>
                </button>
            )}
        </div>
    );
}
