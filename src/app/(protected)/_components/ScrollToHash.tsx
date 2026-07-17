"use client";

import { useEffect } from "react";

/* Scrolls to the #section in the URL once that section actually exists.

   The browser normally does this itself, but it can't here: the campaign page is
   an async server component behind a loading.tsx, so it streams. The HTML the
   browser parses is the skeleton — the real sections arrive moments later and are
   swapped in by script. By the time #statistics exists, the browser has long
   since given up on the fragment, and the page just sits at the top. That's why
   every sidebar section link opened the right campaign at the wrong place.

   Render this INSIDE the streamed content (not the layout): mounting is the
   signal that the sections are in the DOM. scrollIntoView is what does the work —
   it walks up to the real scroller (<main id="app-main">, since the dashboard
   shell is h-screen/overflow-hidden and the window never scrolls) and it honours
   each section's scroll-mt-6.

   Same-page links (#donors while already on that campaign) don't come through
   here at all — no navigation happens, so the browser's own anchor handling
   works. */
export default function ScrollToHash() {
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) return;

        // Re-scroll for a short window rather than once: sections above the target
        // (donor tables, stat bars) hydrate and settle after the first paint, which
        // would otherwise leave the target drifted off where we put it.
        const DEADLINE = 600;
        const start = performance.now();
        let frame = 0;
        let cancelled = false;

        const settle = () => {
            if (cancelled) return;
            document.getElementById(id)?.scrollIntoView({ block: "start" });
            if (performance.now() - start < DEADLINE) frame = requestAnimationFrame(settle);
        };
        frame = requestAnimationFrame(settle);

        // Any deliberate scroll wins — never fight someone who's already moving.
        const stop = () => { cancelled = true; cancelAnimationFrame(frame); };
        const opts = { passive: true, once: true } as const;
        window.addEventListener("wheel", stop, opts);
        window.addEventListener("touchstart", stop, opts);
        window.addEventListener("keydown", stop, opts);

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            window.removeEventListener("wheel", stop);
            window.removeEventListener("touchstart", stop);
            window.removeEventListener("keydown", stop);
        };
    }, []);

    return null;
}
