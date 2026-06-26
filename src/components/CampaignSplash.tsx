/* ── Campaign-creation splash screen ───────────────────────────────────────
   Gmail-style full-screen loader shown (via the create routes' loading.tsx)
   while the campaign wizard loads — the same green "F" logo used in the
   "Create Your Campaign" header, the FundByText wordmark, a short loading
   line, and an indeterminate bar along the bottom. Pure CSS, no JS. */
export default function CampaignSplash() {
    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white px-6">
            <div className="flex flex-col items-center gap-5 text-center">
                <img
                    src="/assets/campaigns/app-logo.svg"
                    alt="FundByText"
                    className="splash-logo h-16 sm:h-20 w-auto"
                />
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-2xl sm:text-3xl font-black tracking-[-0.5px] text-[#003060]">
                        Fund<span className="text-[#28C45D]">by</span>Text
                    </p>
                    <p className="text-sm sm:text-base font-medium text-[#7e8a96]">
                        Setting up your campaign…
                    </p>
                </div>
            </div>

            {/* Indeterminate loading bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-[#eaeef3]">
                <div
                    className="splash-bar h-full w-2/5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#0278DE 0%,#26BA58 100%)" }}
                />
            </div>
        </div>
    );
}
