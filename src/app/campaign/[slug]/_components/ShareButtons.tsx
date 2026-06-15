import Image from "next/image";

const A = "/assets/marketing";

/* ── Round share-button row (Copy link, Facebook, Messenger, WhatsApp, More) ──
   variant "dark"   → translucent black circles (hero, on blue background)
   variant "orange" → solid orange circles (Spread the Word heading row)      */
export default function ShareButtons({ variant }: { variant: "dark" | "orange" }) {
    const circle =
        variant === "dark"
            ? "backdrop-blur-[10px] bg-[rgba(0,0,0,0.3)]"
            : "backdrop-blur-[10px] bg-[#f47435]";
    const gap = variant === "dark" ? "gap-[4px]" : "gap-[6px]";
    const messengerSrc =
        variant === "dark" ? `${A}/icons/messenger.svg` : `${A}/icons/messenger-orange.svg`;

    return (
        <div className={`flex ${gap} items-start`}>
            {/* Copy Link */}
            <button type="button" aria-label="Copy link" className={`${circle} relative overflow-hidden rounded-full size-[40px] shrink-0`}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[16px]">
                    <Image src={`${A}/icons/link.svg`} alt="" width={18} height={18} className="block max-w-none size-full" />
                </span>
            </button>
            {/* Facebook */}
            <button type="button" aria-label="Share on Facebook" className={`${circle} relative overflow-hidden rounded-full size-[40px] shrink-0`}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[28px]">
                    <span className="absolute left-[36.47%] right-[36.46%] top-1/4 bottom-1/4">
                        <Image src={`${A}/icons/facebook.svg`} alt="" width={8} height={14} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                </span>
            </button>
            {/* Messenger (icon ships with its own circle) */}
            <button type="button" aria-label="Share on Messenger" className="relative size-[40px] shrink-0">
                <Image src={messengerSrc} alt="" width={40} height={40} className="absolute inset-0 block max-w-none size-full" />
            </button>
            {/* WhatsApp */}
            <button type="button" aria-label="Share on WhatsApp" className={`${circle} relative overflow-hidden rounded-full size-[40px] shrink-0`}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[32px]">
                    <span className="absolute left-1/4 right-[25.04%] top-[23%] bottom-[27%]">
                        <Image src={`${A}/icons/whatsapp-outline.svg`} alt="" width={16} height={16} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                    <span className="absolute inset-[36.53%_37.82%_41.31%_38.23%]">
                        <Image src={`${A}/icons/whatsapp-glyph.svg`} alt="" width={8} height={8} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                </span>
            </button>
            {/* More */}
            <button type="button" aria-label="More share options" className={`${circle} relative overflow-hidden rounded-full size-[40px] shrink-0`}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[13px] h-[3px]">
                    <Image src={`${A}/icons/menu-dots.svg`} alt="" width={13} height={3} className="absolute inset-0 block max-w-none size-full" />
                </span>
            </button>
        </div>
    );
}
