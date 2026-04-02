"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

// Imperatively injects an overlay into document.body so it survives
// component unmount (which happens when the old page is destroyed during navigation).
function showOverlay(text: string, minMs: number): () => void {
    const el = document.createElement("div");
    el.style.cssText =
        "position:fixed;inset:0;z-index:9999;background:#fff;" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px";
    el.innerHTML = `
        <svg style="width:40px;height:40px;color:#f97316;animation:spin 1s linear infinite" fill="none" viewBox="0 0 24 24">
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            <circle style="opacity:.2" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path style="opacity:.8" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p style="font-size:14px;font-weight:600;color:#4b5563">${text}</p>
    `;
    document.body.appendChild(el);

    let removed = false;
    const remove = () => { if (!removed) { removed = true; el.remove(); } };
    setTimeout(remove, minMs);
    return remove; // caller can also remove early if needed
}

export default function CampaignNavLink({
    href,
    label,
    overlayText,
    className,
    children,
}: {
    href: string;
    label?: string;
    overlayText: string;
    className?: string;
    children?: React.ReactNode;
}) {
    const router  = useRouter();
    const hrefRef = useRef(href);
    hrefRef.current = href;

    function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        showOverlay(overlayText, 850);
        router.push(hrefRef.current);
    }

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children ?? label}
        </a>
    );
}
