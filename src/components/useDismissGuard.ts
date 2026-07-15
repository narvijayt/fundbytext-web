"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Protects a form modal from accidental dismissal. While `dirty` is true (the
 * user has entered/changed something), an outside-click or Escape plays a short
 * horizontal shake — the `modal-nudge` class from globals.css — instead of
 * closing, so a stray click can't wipe what they typed. The ✕ button and Cancel
 * should still call the real `close` directly to dismiss outright.
 *
 * Usage inside a modal:
 *   const { nudge, requestClose } = useDismissGuard(dirty, close);
 *   // backdrop:  onClick={() => { if (startedOnBackdrop) requestClose(); }}
 *   // Escape:    if (e.key === "Escape") requestClose();
 *   // card:      className={`… ${nudge ? "modal-nudge" : ""}`}
 *
 * `requestClose` is stable across renders and reads the latest `dirty`/`close`
 * via refs, so it's safe to use inside a once-registered key listener.
 */
export function useDismissGuard(dirty: boolean, close: () => void) {
    const [nudge, setNudge] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dirtyRef = useRef(dirty);
    const closeRef = useRef(close);
    useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
    useEffect(() => { closeRef.current = close; }, [close]);

    const requestClose = useCallback(() => {
        if (dirtyRef.current) {
            setNudge(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setNudge(false), 450);
            return;
        }
        closeRef.current();
    }, []);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    return { nudge, requestClose };
}
