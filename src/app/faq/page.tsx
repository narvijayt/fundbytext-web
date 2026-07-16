import Link from "next/link";
import type { Metadata } from "next";
import MarketingDocShell from "@/components/MarketingDocShell";
import FaqAccordion, { type Faq } from "./_components/FaqAccordion";

export const metadata: Metadata = {
    title: "FAQs — FundByText",
    description: "Answers to common questions about creating campaigns, donating, payouts, and your account on FundByText.",
};

// Grounded in how the platform actually works: implicit accounts, the 5-step
// wizard, individual vs organization campaigns, the 15% fee and 10-day payout.
const FAQS: Faq[] = [
    {
        q: "What is FundByText?",
        a: "FundByText is a text-driven fundraising platform. You create a campaign, then share its link by text, email, or social media — and supporters can donate in just a few taps, with no account or app to download.",
    },
    {
        q: "Do I need to sign up before I can start?",
        a: "There's no separate sign-up step. Your account is created automatically the first time you start a campaign — you enter your name and email in the first step and you're on your way.",
    },
    {
        q: "How do I create a campaign?",
        a: "Creating a campaign takes five quick steps: your campaign details, your funding goal, photos and colors, adding participants or donor contacts, and a thank-you message. You can save your progress and come back anytime before launching.",
    },
    {
        q: "Is it free to start a campaign?",
        a: "Yes — starting a campaign is completely free. FundByText keeps 15% of the donations you raise to cover payment processing, platform overhead, and marketing. There are no upfront or monthly costs.",
    },
    {
        q: "What's the difference between an individual and an organization campaign?",
        a: "An individual campaign is run by one person for a personal cause. An organization campaign lets a whole team fundraise together — each participant gets their own share link and appears on a live leaderboard, working toward either a shared goal or a per-participant target.",
    },
    {
        q: "Can I add other people to fundraise with me?",
        a: "Yes. On an organization campaign, the organizer can add participants, and each one receives their own login and personal share link. As the organizer you can even add yourself as a participant with a single tap.",
    },
    {
        q: "What kinds of goals can I set?",
        a: "You can set a fixed dollar goal, an open-ended goal that automatically grows by 20% each time it's met, a per-participant target, or a single shared goal for the whole organization.",
    },
    {
        q: "Can I edit my campaign after it launches?",
        a: "Absolutely. From your dashboard you can update your photos, your story, your participants, and most settings while the campaign is live.",
    },
    {
        q: "Do donors need an account to give?",
        a: "No. Donors simply tap your campaign link, land on your page, and give in a few seconds — no account or app required. They can also choose to give anonymously if they prefer.",
    },
    {
        q: "What payment methods are accepted?",
        a: "Donors can pay with major cards and wallets — including Visa, Mastercard, PayPal, JCB, and more — all processed securely.",
    },
    {
        q: "When and how do I get paid?",
        a: "Once your campaign finishes, a check is mailed out within 10 business days. The short wait lets every donation clear before the funds are sent, so the amount you receive is final.",
    },
    {
        q: "I was added as a participant — how do I sign in?",
        a: "When an organizer adds you, you'll receive an email with your login details. Sign in and you'll find your own dashboard with your personal share link, your donors, and your progress toward your goal.",
    },
    {
        q: "How is my personal information handled?",
        a: (
            <>
                We only collect what&rsquo;s needed to run your campaign and process donations, and we never sell your data. See our{" "}
                <Link href="/privacy" className="font-semibold text-[#0268c0] underline underline-offset-2 hover:opacity-80">Privacy Policy</Link>{" "}
                and{" "}
                <Link href="/cookies" className="font-semibold text-[#0268c0] underline underline-offset-2 hover:opacity-80">Cookie Policy</Link>{" "}
                for the full details.
            </>
        ),
    },
];

export default function FAQPage() {
    return (
        <MarketingDocShell
            badge="Got Questions?"
            title="Frequently Asked Questions"
            intro="Everything you need to know about creating campaigns, giving, and getting paid. Can't find what you're looking for? Our team is one message away."
        >
            <FaqAccordion items={FAQS} />

            {/* Still-have-questions CTA, inside the card below the list. */}
            <div className="flex w-full flex-col items-center gap-4 rounded-[16px] border border-[#e7edf3] bg-[#f7fafd] px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                    <p className="font-black text-[#003060] text-[18px] lg:text-[20px]">Still have a question?</p>
                    <p className="mt-1 text-[14px] lg:text-[15px] text-[#7e8a96]">Our support team is happy to help you get set up.</p>
                </div>
                <Link href="/contact"
                    className="relative shrink-0 overflow-hidden rounded-[14px] px-6 py-3.5 text-white font-black text-xs tracking-[1px] uppercase transition-transform hover:scale-105"
                    style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                    <span className="relative z-10">Contact us</span>
                    <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                </Link>
            </div>
        </MarketingDocShell>
    );
}
