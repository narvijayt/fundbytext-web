import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

// ── Fetch a handful of active campaigns for the hero carousel ───────────────
async function getFeaturedCampaigns() {
    try {
        return await prisma.campaign.findMany({
            where: { status: "active" },
            take: 6,
            orderBy: { created_at: "desc" },
            select: {
                slug: true,
                name: true,
                campaign_type: true,
                goal_amount: true,
                media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
            },
        });
    } catch {
        return [];
    }
}

// ── Placeholder cards used when no live campaigns exist ─────────────────────
const PLACEHOLDER_CARDS = [
    { slug: "#", name: "Help Charlie with Vet Bills",         img: null, goal: "$5,000",  type: "SPORTS"   },
    { slug: "#", name: "Colorado Sparkler Softball Trip",      img: null, goal: "$4,500",  type: "TRAVEL"   },
    { slug: "#", name: "Spring Fundraiser for Cowboys Baseball",img: null, goal: "$10,000", type: "SPORTS"   },
    { slug: "#", name: "Help Fund Travel to Nationals",        img: null, goal: "$6,500",  type: "SPORTS"   },
    { slug: "#", name: "Summer Mission Trip Abroad",           img: null, goal: "$8,000",  type: "MISSION"  },
];

const STEPS = [
    { n: 1, title: "Create a campaign",       desc: "Simply fill in the campaign details to tell us about yourself or your organization. Setup takes only minutes." },
    { n: 2, title: "Enter donor information", desc: "Add your donors and participants so they receive campaign outreach automatically." },
    { n: 3, title: "Share your campaign",     desc: "Your custom campaign link goes out via text, email, or social — wherever donors are." },
    { n: 4, title: "Donors donate",           desc: "Donors give securely online. You see every contribution in real time." },
    { n: 5, title: "You get paid",            desc: "Funds are mailed to you by check once the campaign closes." },
];

const STATS = [
    { value: "200+",  label: "Campaigns Launched" },
    { value: "97%",   label: "Goals Met"           },
    { value: "34+",   label: "Organizations"       },
    { value: "$5.2M+",label: "Raised & Counting"  },
];

const STORIES = [
    { tag: "",            title: "Fund to Fix My Car After Hit and Run",  img: null },
    { tag: "SPORTS",      title: "Colorado Sparkler Softball Trip",        img: null },
    { tag: "RAISING HOPE",title: "Raising Funds for a New Chair",          img: null },
];

// ── Gradient hero background ─────────────────────────────────────────────────
const heroBg = "linear-gradient(175deg,#e8f4fd 0%,#c5e3f7 30%,#7dc4f0 65%,#2d8fd5 100%)";
const blueBg = "linear-gradient(160deg,#1a6fbf 0%,#1565C0 50%,#0d4fa8 100%)";

export default async function HomePage() {
    const [liveCampaigns, user] = await Promise.all([getFeaturedCampaigns(), getAuthUser()]);

    const cards = liveCampaigns.length
        ? liveCampaigns.map((c) => ({
              slug:  `/campaigns/${c.slug}`,
              name:  c.name ?? "Untitled Campaign",
              img:   c.media[0]?.url ?? null,
              goal:  c.goal_amount ? `$${Number(c.goal_amount).toLocaleString()}` : null,
              type:  c.campaign_type === "organization" ? "ORG" : "SPORTS",
          }))
        : PLACEHOLDER_CARDS;

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3" style={{ background: "#0a1628" }}>
                <div className="flex items-center gap-6 text-sm text-white/70">
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                        Menu
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7 7 0 104.35 16.65 7 7 0 0016.65 16.65z"/></svg>
                        Search
                    </button>
                </div>

                <Link href="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1565C0" }}>
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">FundByText</span>
                </Link>

                <div className="flex items-center gap-4 text-sm">
                    {user ? (
                        <Link href="/dashboard" className="px-4 py-1.5 rounded-full text-white font-semibold text-sm transition-colors" style={{ background: "#f97316" }}>
                            My Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-white/70 hover:text-white transition-colors">Sign In</Link>
                            <Link href="/campaigns/create" className="px-4 py-1.5 rounded-full text-white font-semibold text-sm transition-colors" style={{ background: "#f97316" }}>
                                Start A Campaign
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section className="relative pt-16 pb-0 text-center overflow-hidden" style={{ background: heroBg, minHeight: 520 }}>
                {/* Subtle grid/dot pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #1565C0 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                <div className="relative z-10 px-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 text-blue-800" style={{ background: "rgba(255,255,255,0.7)" }}>
                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        Launch your fundraiser in minutes.
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight mb-6 max-w-3xl mx-auto">
                        Effortless Fundraising<br />
                        <span className="relative">
                            for Sports Teams
                            <span className="inline-block w-0.5 h-10 bg-blue-700 ml-1 animate-pulse align-middle" />
                        </span>
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/campaigns/create" className="px-7 py-3 rounded-full text-white font-bold text-sm shadow-lg transition-transform hover:scale-105" style={{ background: "#f97316" }}>
                            GET STARTED FOR FREE
                        </Link>
                        <Link href="#how-it-works" className="flex items-center gap-2 text-blue-800 font-semibold text-sm hover:text-blue-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                            SEE HOW IT WORKS
                        </Link>
                    </div>
                </div>

                {/* Campaign cards row */}
                <div className="relative z-10 overflow-x-auto pb-8">
                    <div className="flex gap-4 px-8 w-max mx-auto">
                        {cards.map((c, i) => (
                            <Link
                                key={i}
                                href={c.slug}
                                className="flex-none w-44 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                            >
                                <div className="relative h-28 bg-linear-to-br from-blue-200 to-blue-400">
                                    {c.img ? (
                                        <Image src={c.img} alt={c.name} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        </div>
                                    )}
                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: "#22c55e" }}>
                                        ACTIVE
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-2">{c.name}</p>
                                    {c.goal && (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ background: "#22c55e" }}>
                                            {c.goal} Goal
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats bar ──────────────────────────────────────────────── */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    {STATS.map((s) => (
                        <div key={s.label}>
                            <p className="text-3xl font-extrabold text-blue-800">{s.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────────────── */}
            <section id="how-it-works" className="bg-white py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest text-center mb-3">How It Works</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center mb-14">Fundraising made easy</h2>

                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Phone mockup */}
                        <div className="flex-none lg:w-64">
                            <div className="relative mx-auto w-52 h-96 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-800" style={{ background: "#1565C0" }}>
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full" />
                                <div className="mt-10 mx-3 bg-white rounded-2xl overflow-hidden shadow-lg">
                                    <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                                                <span className="text-white text-[8px] font-bold">F</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-blue-800">Create Your Campaign</span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full w-2/5 bg-orange-400 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <p className="text-[9px] font-semibold text-gray-700">Campaign Details</p>
                                        {["Campaign name", "Campaign type", "Start date"].map((f) => (
                                            <div key={f} className="h-5 bg-gray-100 rounded-md" />
                                        ))}
                                        <p className="text-[8px] text-gray-400 mt-1">What's the name of your campaign?</p>
                                        <div className="h-4 bg-orange-100 rounded-md border border-orange-300" />
                                        <div className="mt-2 w-full py-1 rounded-md text-center text-[8px] font-bold text-white" style={{ background: "#f97316" }}>
                                            Save for the New Football Team!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="flex-1 space-y-4">
                            {STEPS.map((s, i) => (
                                <div
                                    key={s.n}
                                    className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${i === 0 ? "shadow-md border border-blue-100" : ""}`}
                                    style={i === 0 ? { background: "#f0f7ff" } : {}}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? "text-white" : "bg-gray-100 text-gray-400"}`}
                                        style={i === 0 ? { background: "#1565C0" } : {}}>
                                        {i === 0 ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        ) : s.n}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${i === 0 ? "text-blue-800" : "text-gray-400"}`}>{s.title}</p>
                                        {i === 0 && <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>}
                                    </div>
                                </div>
                            ))}
                            <Link href="/campaigns/create" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full text-white font-bold text-sm" style={{ background: "#f97316" }}>
                                GET STARTED FOR FREE
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Partners bar ───────────────────────────────────────────── */}
            <section className="py-8 px-6 bg-white">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-8 px-8 py-4 rounded-full flex-wrap" style={{ background: "#0a1628" }}>
                        {["Netflix", "Buffer", "Stripe", "Framer", "HubSpot", "Dribbble"].map((b) => (
                            <span key={b} className="text-white/60 text-sm font-semibold tracking-wide hover:text-white/90 transition-colors cursor-default">{b}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── See How It Works (video) ───────────────────────────────── */}
            <section className="py-20 px-6 text-center" style={{ background: blueBg }}>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-10">See How It Works</h2>
                <div className="relative max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-linear-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/20" />
                        <button className="relative z-10 w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors group">
                            <svg className="w-6 h-6 text-blue-700 group-hover:text-blue-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                        iStock · Credit: JohnnyGreig
                    </div>
                </div>
            </section>

            {/* ── Org vs Individual ──────────────────────────────────────── */}
            <section className="bg-white py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">What&apos;s the Difference?</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3">Organization vs. Individual</h2>
                    <p className="text-gray-500 text-sm mb-12 max-w-md mx-auto">Not all fundraisers work the same way. Here&apos;s how organization and individual campaigns differ.</p>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {[
                            { type: "Organization Campaigns", desc: "One central goal for the entire group and progress is tracked at an organization level.", color: "#1565C0" },
                            { type: "Individual Campaigns",   desc: "Each participant has an individual goal. Supports friendly competition with leaderboards.",  color: "#f97316" },
                        ].map((c) => (
                            <div key={c.type} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left">
                                <div className="h-36 flex items-center justify-center" style={{ background: `${c.color}20` }}>
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: c.color }}>
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <p className="font-bold text-sm mb-1" style={{ color: c.color }}>{c.type}</p>
                                    <p className="text-xs text-gray-500">{c.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How People Use FundByText ──────────────────────────────── */}
            <section className="py-20 px-6" style={{ background: "linear-gradient(175deg, #f0f7ff 0%, #dbeeff 50%, #b8d9f5 100%)" }}>
                <div className="max-w-5xl mx-auto">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest text-center mb-3">Real Stories</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center mb-12">How people use FundByText</h2>

                    <div className="grid sm:grid-cols-3 gap-6">
                        {STORIES.map((s, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-36 bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                                    <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    {s.tag && (
                                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: "#22c55e" }}>{s.tag}</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-sm font-bold text-gray-800 mb-2">{s.title}</p>
                                    <p className="text-xs text-gray-400 line-clamp-2">Lorem ipsum dolor sit amet consectetur adipiscing elit. Quam adipiscing elit aliqua ut enim aliquam.</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/campaigns" className="text-blue-700 text-sm font-semibold hover:text-blue-800 underline underline-offset-2 transition-colors">
                            View all campaigns →
                        </Link>
                    </div>

                    {/* Pagination dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="w-2 h-2 rounded-full bg-blue-200" />
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <section className="bg-white py-20 px-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3">Ready to Inspire?</h2>
                <p className="text-gray-500 text-sm mb-8">Start Your FundByText Campaign Today.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/campaigns/create" className="px-8 py-3 rounded-full text-white font-bold text-sm shadow-md transition-transform hover:scale-105" style={{ background: "#f97316" }}>
                        GET STARTED FOR FREE
                    </Link>
                    <Link href="#how-it-works" className="text-blue-700 text-sm font-semibold hover:text-blue-800 transition-colors underline underline-offset-2">
                        SEE HOW IT WORKS
                    </Link>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer style={{ background: "#0a1628" }} className="px-6 pt-14 pb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1565C0" }}>
                                    <span className="text-white font-bold text-sm">F</span>
                                </div>
                                <span className="text-white font-bold text-lg">FundByText</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                                </div>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.127 1.195 4.937 4.937 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Nav */}
                        <div>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Navigate</p>
                            <ul className="space-y-2.5">
                                {["Browse Campaign", "How It Works", "Help", "Resources", "About Us", "Help & Support"].map((l) => (
                                    <li key={l}><Link href="#" className="text-white/60 text-sm hover:text-white transition-colors">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Payment */}
                        <div>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Payment Methods</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {["Visa", "MC", "PayPal"].map((p) => (
                                    <div key={p} className="px-3 py-1.5 bg-white/10 rounded text-white/70 text-xs font-bold">{p}</div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="bg-white/5 rounded-2xl p-6">
                            <p className="text-white font-bold text-lg mb-1">Ready to Inspire?</p>
                            <p className="text-white/50 text-xs mb-4">Start Your FundByText Campaign Today.</p>
                            <Link href="/campaigns/create" className="block text-center py-2 rounded-full text-white text-xs font-bold mb-2 transition-colors" style={{ background: "#f97316" }}>
                                GET STARTED FOR FREE
                            </Link>
                            <Link href="#how-it-works" className="block text-center py-2 rounded-full text-white/60 text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors">
                                SEE HOW IT WORKS
                            </Link>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
                        <p>© FundByText 2026 — All Rights Reserved.</p>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-white/60 transition-colors">Terms & Conditions</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
