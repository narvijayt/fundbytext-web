"use client";

/* The current calendar year, evaluated in the browser so copyright footers stay
   correct every year without a rebuild. `suppressHydrationWarning` avoids a
   console warning when a statically-rendered page is viewed in a later year. */
export default function CurrentYear() {
    return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
