import Link from "next/link";

export default function CampaignNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

            {/* Minimal navbar */}
            <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-orange-500 hidden sm:block">FundByText</span>
                </Link>
            </nav>

            {/* Body */}
            <div className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="text-center max-w-md">

                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                        Campaign Not Found
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        This campaign doesn&apos;t exist or the link you followed may be incorrect.
                        If you believe this is a mistake, contact the person who shared the link with you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go Home
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                        >
                            My Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
