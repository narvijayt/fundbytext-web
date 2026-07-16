import Link from "next/link";
import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";
import HeroBackdrop from "@/components/home/HeroBackdrop";

// ── Asset paths ───────────────────────────────────────────────────────────────
const A_FLAG_PIN = "/figma/flag-pin.svg";

// ── Content ───────────────────────────────────────────────────────────────────
// A self-contained fundraising guide — no per-article sub-pages, so there are no
// dead "read more" links. The tips are grounded in how the platform actually works
// (individual vs organization campaigns, auto-generated shareables, the flat 15%
// fee, checks mailed within 10 business days), so they stay true if features move.
type Guide = { title: string; body: string };
type Group = { heading: string; blurb: string; guides: Guide[] };

const GROUPS: Group[] = [
    {
        heading: "Set up for success",
        blurb: "A few minutes of setup decides how far your campaign travels.",
        guides: [
            { title: "Pick a goal you can hit", body: "Set a specific, realistic target. A goal within reach builds early momentum — and you can always raise it once you're close." },
            { title: "Choose the right campaign type", body: "An individual campaign rallies your own network; an organization campaign lets a team of participants each bring their circle. Match it to who's doing the asking." },
            { title: "Lead with a strong title and photo", body: "Your title and cover image are the first thing people see when they open your link. Make the title specific and use one bright, real photo." },
        ],
    },
    {
        heading: "Tell a story that moves people",
        blurb: "Donors give to people and reasons, not to progress bars.",
        guides: [
            { title: "Start with the why", body: "Open with the reason you're raising funds and who it helps. A clear, human why is what turns a reader into a donor." },
            { title: "Be specific about the impact", body: "Say exactly where the money goes — “$50 covers a week of meals” beats “help us out.” Specifics build trust and make giving feel real." },
            { title: "Keep it short and real", body: "A few honest sentences and real photos beat a long essay. People decide in seconds, so lead with what matters most." },
        ],
    },
    {
        heading: "Spread the word & finish strong",
        blurb: "The best campaigns are shared, not broadcast.",
        guides: [
            { title: "Text your inner circle first", body: "Early donations create momentum. Start with the people closest to you, then widen out — a campaign that's already moving is far easier to share." },
            { title: "Use your shareables", body: "FundByText builds social-ready graphics and a QR code for your campaign automatically. Post them everywhere — every share is a new door to a donor." },
            { title: "Post updates, then get paid", body: "Thank donors publicly and share milestones to pull in the last stretch. FundByText takes a flat 15% fee, and your check is mailed within 10 business days of the campaign ending." },
        ],
    },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

// The blue flag-pin icon with its glow — identical construction to /about and
// /how-it-works.
function FlagGlyph({ size }: { size: number }) {
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                style={{
                    width: size * 2.875, height: size * 2.875,
                    top: -size * 0.5625, left: -size * 0.9375,
                }} />
        </div>
    );
}

function SectionBadge({ label }: { label: string }) {
    return (
        <div className="flex w-full justify-center">
            <div className="flex items-center gap-2.5 pl-2.5 pr-5 py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)] w-auto">
                <FlagGlyph size={32} />
                <span className="font-bold text-[#57728d] text-xs tracking-[1px] uppercase leading-none whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourcesPage() {
    const user = await getAuthUser();

    // Number the cards 01…09 continuously across the groups, like a playbook. The
    // offset is each group's start index, computed up front so nothing mutates
    // during render.
    const groupStart = GROUPS.reduce<number[]>((acc, g, i) => {
        acc.push(i === 0 ? 0 : acc[i - 1] + GROUPS[i - 1].guides.length);
        return acc;
    }, []);

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO — shared marketing backdrop, no video (short band)
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative">
                <HeroBackdrop />

                <NavBar user={user} />

                <div className="relative z-10 flex flex-col items-center gap-6 pt-8 pb-16 lg:pt-[62px] lg:pb-28 px-8 md:px-[38px] lg:px-10 w-full">
                    <div className="flex flex-col items-center gap-6 w-full max-w-[760px]">
                        <SectionBadge label="Resources" />
                        <h1 className="font-black text-[32px] sm:text-[38px] md:text-[46px] lg:text-[50px] xl:text-[56px] 2xl:text-[64px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent pb-[0.12em] w-full"
                            style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            Everything you need to raise more.
                        </h1>
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[20px] xl:text-[22px] font-normal leading-[1.4] max-w-[640px]">
                            Practical guides and tips to help you launch your campaign, tell your story, and hit your goal — straight from what works on FundByText.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                GUIDES
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-4 lg:pt-8 pb-16 lg:pb-24 px-4 md:px-6 lg:px-10">
                <div className="flex flex-col gap-14 lg:gap-20 max-w-[1200px] mx-auto">
                    {GROUPS.map((group, gi) => (
                        <div key={group.heading} className="flex flex-col gap-6 lg:gap-8">
                            <div className="flex flex-col gap-2 max-w-[720px]">
                                <h2 className="font-black text-[#003060] text-2xl sm:text-3xl lg:text-[38px] leading-[1.15] tracking-[-0.5px]">
                                    {group.heading}
                                </h2>
                                <p className="font-normal text-[#57728d] text-base lg:text-lg leading-[1.4]">{group.blurb}</p>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.guides.map((g, li) => (
                                    <div key={g.title}
                                        className="bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-3 shadow-[0_20px_40px_-24px_rgba(0,91,172,0.25)]">
                                        <span className="flex size-10 items-center justify-center rounded-full bg-[#eef4f9] font-black text-[#0268c0] text-sm">
                                            {String(groupStart[gi] + li + 1).padStart(2, "0")}
                                        </span>
                                        <p className="font-black text-[#003060] text-[18px] lg:text-[20px] leading-[1.25]">{g.title}</p>
                                        <p className="font-normal text-[#2f3a45] text-[15px] lg:text-base leading-[1.4]">{g.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* CTA band */}
                    <div className="relative overflow-hidden rounded-[24px] px-6 py-10 lg:px-12 lg:py-14 flex flex-col items-center text-center gap-5"
                        style={{ background: "linear-gradient(135deg,#0268c0 0%,#0278de 100%)" }}>
                        <h3 className="font-black text-white text-2xl sm:text-3xl lg:text-[40px] leading-[1.1]">Ready to put it into action?</h3>
                        <p className="text-white/85 text-base lg:text-lg leading-[1.4] max-w-[540px]">
                            Launch your campaign in minutes — no setup fees, no friction. Everything above is built right into the flow.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-2 w-full sm:w-auto">
                            <Link href="/campaigns/create"
                                className="flex items-center justify-center px-7 py-4 rounded-[16px] font-black text-xs tracking-[1px] uppercase text-white transition-transform hover:scale-105 whitespace-nowrap"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                Start a Campaign
                            </Link>
                            <Link href="/how-it-works"
                                className="flex items-center justify-center px-7 py-4 rounded-[16px] font-black text-xs tracking-[1px] uppercase text-white border border-white/40 hover:bg-white/10 transition-colors whitespace-nowrap">
                                See How It Works
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
