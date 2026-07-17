"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import PageSplash from "@/components/PageSplash";

/**
 * The route splash for the auth pages, portalled to <body>.
 *
 * Why it can't just render PageSplash directly: on a move BETWEEN two auth pages the
 * (auth) layout persists (that's Next's model — only the changing segment gets a
 * fallback), so a loading.tsx renders into the layout's children slot. That slot is
 * `relative z-10`, which CREATES A STACKING CONTEXT — so PageSplash's z-[1000] is
 * scoped inside it and only competes as z-10 against the NavBar's `sticky z-50`. The
 * header won, and its centre logo sat on top of the splash. Everywhere else the
 * splash comes from the root boundary, which replaces the whole page, nav included —
 * hence the inconsistency.
 *
 * Raising the slot's z-index instead would fix the splash but let the card scroll
 * OVER the sticky header, so the fix is to leave the layout's layering alone and take
 * the splash out of it: as a direct child of <body> it's back at the root stacking
 * context, where z-[1000] beats both the nav (50) and the portalled mobile drawer (100).
 *
 * useSyncExternalStore is the mount check: it returns the server snapshot (false)
 * during SSR and true once hydrated, without a setState-in-an-effect (an error under
 * this repo's react-hooks config). Rendering nothing during SSR is fine — a cold load
 * suspends on the async (auth) layout, so the ROOT splash covers that case already,
 * and that one is full-screen and correct.
 */
const subscribe = () => () => {};

export default function AuthSplash({ message }: { message?: string }) {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    if (!mounted) return null;
    return createPortal(<PageSplash message={message} />, document.body);
}
