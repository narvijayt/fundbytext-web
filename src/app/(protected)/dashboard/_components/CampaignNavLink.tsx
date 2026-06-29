import Link from "next/link";

/* Campaign navigation link.

   Previously this injected a full-screen white spinner overlay into <body> on
   click — which covered the sidebar and the whole screen. That's now handled by
   route-level loading.tsx instead: opening a campaign shows a skeleton inside the
   dashboard <main> (sidebar stays put), and the creation wizard shows its splash.
   So this is just a prefetching <Link>; the loading fallback appears instantly on
   navigation. (`overlayText` is kept for call-site compatibility but unused.) */
export default function CampaignNavLink({
    href,
    label,
    className,
    children,
}: {
    href: string;
    label?: string;
    /** @deprecated no longer used — route loading.tsx provides the fallback */
    overlayText?: string;
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <Link href={href} prefetch className={className}>
            {children ?? label}
        </Link>
    );
}
