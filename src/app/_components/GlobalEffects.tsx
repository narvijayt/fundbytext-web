"use client";

import { useEffect } from "react";

export default function GlobalEffects() {
    useEffect(() => {
        function handleWheel() {
            const el = document.activeElement as HTMLInputElement | null;
            if (el?.type === "number") el.blur();
        }
        document.addEventListener("wheel", handleWheel, { passive: true });
        return () => document.removeEventListener("wheel", handleWheel);
    }, []);

    useEffect(() => {
        function handleDragStart(e: DragEvent) {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if ((target.tagName === "IMG" || target.tagName === "SVG") && !target.closest(".app-logo")) {
                e.preventDefault();
            }
        }
        document.addEventListener("dragstart", handleDragStart);
        return () => document.removeEventListener("dragstart", handleDragStart);
    }, []);

    return null;
}
