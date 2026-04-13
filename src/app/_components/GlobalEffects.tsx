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

    return null;
}
