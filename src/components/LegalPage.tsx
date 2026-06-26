import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";

const A_FLAG_PIN = "/figma/flag-pin.svg";
const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(255%2C255%2C255%2C0.22)'/%3E%3C/svg%3E")`;

// Section = { title, lead?, bullets?, body? }. Bullets render as a disc list;
// a "Label: text" bullet bolds the label.
export type Section = { title: string; lead?: string; bullets?: string[]; body?: string };

function PolicyBadge({ label }: { label: string }) {
    return (
        <div className="flex justify-center w-full">
            <div className="flex items-center gap-2 pl-2.5 pr-5 py-2.5 rounded-full border border-[#d4dee7] bg-white shadow-[0_12px_20px_-8px_rgba(0,91,172,0.2)] w-auto">
                <div className="relative w-7 h-7 shrink-0 overflow-hidden">
                    <img alt="" src={A_FLAG_PIN} className="absolute max-w-none" style={{ width: 80, height: 80, top: -12, left: -21 }} />
                </div>
                <span className="font-bold text-[#003060] text-xs sm:text-sm whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

function Bullet({ text }: { text: string }) {
    const i = text.indexOf(":");
    if (i > 0 && i < 24) {
        return (
            <li>
                <span className="font-bold text-[#003060]">{text.slice(0, i + 1)}</span>{text.slice(i + 1)}
            </li>
        );
    }
    return <li>{text}</li>;
}

function PolicyBlock({ s }: { s: Section }) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="font-black text-[#0268c0] text-xl lg:text-2xl">{s.title}</h2>
            {s.lead && <p className="text-[#2f3a45] text-base lg:text-lg leading-relaxed">{s.lead}</p>}
            {s.bullets && (
                <ul className="list-disc pl-6 space-y-2 text-[#2f3a45] text-base lg:text-lg leading-relaxed marker:text-[#0268c0]">
                    {s.bullets.map((b, i) => <Bullet key={i} text={b} />)}
                </ul>
            )}
            {s.body && <p className="text-[#2f3a45] text-base lg:text-lg leading-relaxed">{s.body}</p>}
        </div>
    );
}

export default async function LegalPage({
    badge, title, intro, sections,
}: { badge: string; title: string; intro: string; sections: Section[] }) {
    const user = await getAuthUser();

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">
            <section className="relative overflow-hidden">
                {/* Coded blue gradient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(180deg,#1f8bf5 0%,#2196fd 30%,#52aafe 70%,#9fd2ff 100%)",
                    }} />
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 78% 42% at 50% 16%,rgba(255,255,255,0.85) 0%,rgba(255,255,255,0.35) 38%,transparent 64%)",
                    }} />
                    <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                </div>

                <NavBar user={user} />

                <div className="relative z-10 px-4 sm:px-6 lg:px-36 pt-8 lg:pt-12 pb-16 lg:pb-24">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[916px] mx-auto text-center">
                        <PolicyBadge label={badge} />
                        <h1 className="font-black text-4xl sm:text-5xl lg:text-[64px] leading-[1.05] tracking-[-1px] bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(150deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            {title}
                        </h1>
                        <p className="text-[#1b3a5c] text-base lg:text-lg leading-relaxed max-w-[820px]">{intro}</p>
                    </div>

                    {/* White card with sections */}
                    <div className="mt-10 lg:mt-14 mx-auto max-w-[1152px] bg-white rounded-[24px] lg:rounded-[32px] shadow-[0_30px_60px_-20px_rgba(0,48,96,0.35)] p-6 sm:p-10 lg:p-14">
                        <div className="flex flex-col gap-8 lg:gap-10">
                            {sections.map((s) => <PolicyBlock key={s.title} s={s} />)}
                        </div>
                    </div>
                </div>

                {/* White arch base → footer */}
                <svg className="block w-full" viewBox="0 0 1440 120" preserveAspectRatio="none"
                    style={{ height: "clamp(40px,6vw,90px)", display: "block", marginTop: -1, marginBottom: -2 }} aria-hidden="true">
                    <path d="M0,72 Q720,4 1440,72 L1440,120 L0,120 Z" fill="white" />
                </svg>
            </section>

            <SiteFooter />
        </div>
    );
}
