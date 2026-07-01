"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// Run before paint on the client (avoids a scroll flash); no-op on the server.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* The dashboard shell scrolls inside a custom container (<main id="app-main">, an
   overflow-y-auto element pinned in an h-screen/overflow-hidden shell). Next.js's
   built-in scroll restoration targets the window, which never scrolls here — so a
   client-side navigation would leave <main> at the previous page's scroll position
   (the new page appears mid-scroll). This resets that container to the top on every
   route (pathname) change, while leaving in-page hash anchors (#donors, …) alone. */
export default function ScrollToTop({ targetId = "app-main" }: { targetId?: string }) {
    const pathname = usePathname();

    useIsomorphicLayoutEffect(() => {
        // A hash means the user is deep-linking to a section — let the browser position it.
        if (window.location.hash) return;
        document.getElementById(targetId)?.scrollTo({ top: 0, left: 0 });
        window.scrollTo(0, 0);
    }, [pathname, targetId]);

    return null;
}
