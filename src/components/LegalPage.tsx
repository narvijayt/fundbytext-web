import MarketingDocShell from "@/components/MarketingDocShell";

/* ── Shared legal page (privacy / terms / cookies) ──────────────────────────
   Figma 5430:134333. The marketing doc shell (hero + white card + footer) filled
   with policy sections. The Figma is drawn at 1920, so every size steps down and
   only reaches its Figma value at 2xl. */

// Figma "Headline Gradient", used on the section titles.
const HEADLINE_GRADIENT = "linear-gradient(172.74deg,rgb(38,91,145) 30.542%,rgb(0,48,96) 69.458%)";

// Section = { title, lead?, bullets?, body? }. Bullets render as a disc list;
// a "Label: text" bullet bolds the label.
export type Section = { title: string; lead?: string; bullets?: string[]; body?: string };

function Bullet({ text }: { text: string }) {
    const i = text.indexOf(":");
    if (i > 0 && i < 24) {
        return (
            <li className="ms-[18px] lg:ms-[26px] 2xl:ms-[42px]">
                <span className="font-bold text-[#003060]">{text.slice(0, i + 1)}</span>{text.slice(i + 1)}
            </li>
        );
    }
    return <li className="ms-[18px] lg:ms-[26px] 2xl:ms-[42px]">{text}</li>;
}

/* Figma "Title + Body Text": a 32px gradient title over 28px charcoal body,
   32px apart. */
function PolicyBlock({ s }: { s: Section }) {
    const bodyCls = "font-normal leading-[1.4] text-[#2f3a45] text-[15px] lg:text-[17px] xl:text-[20px] 2xl:text-[28px]";
    return (
        <div className="flex w-full flex-col items-start gap-4 lg:gap-6 2xl:gap-8">
            {/* bg-clip-text sizes the gradient to the padding box, so the pad keeps
                it off the descenders. */}
            <h2 className="w-full bg-clip-text font-black leading-none tracking-[-1px] text-transparent pb-[0.12em] text-[20px] lg:text-[24px] xl:text-[28px] 2xl:text-[32px]"
                style={{ backgroundImage: HEADLINE_GRADIENT }}>
                {s.title}
            </h2>
            {s.lead && <p className={bodyCls}>{s.lead}</p>}
            {s.bullets && (
                <ul className={`block w-full list-disc space-y-1.5 lg:space-y-2 ${bodyCls}`}>
                    {s.bullets.map((b, i) => <Bullet key={i} text={b} />)}
                </ul>
            )}
            {s.body && <p className={bodyCls}>{s.body}</p>}
        </div>
    );
}

export default function LegalPage({
    badge, title, intro, sections,
}: { badge: string; title: string; intro: string; sections: Section[] }) {
    return (
        <MarketingDocShell badge={badge} title={title} intro={intro}>
            {sections.map((s) => <PolicyBlock key={s.title} s={s} />)}
        </MarketingDocShell>
    );
}
