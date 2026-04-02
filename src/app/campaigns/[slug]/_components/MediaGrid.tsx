import Image from "next/image";

type Props = {
    heroUrl:     string | null;
    galleryUrls: string[];
    campaignName: string;
};

export default function MediaGrid({ heroUrl, galleryUrls, campaignName }: Props) {
    const hasGallery = galleryUrls.length > 0;

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {hasGallery ? (
                /* Hero + gallery side-by-side grid */
                <div className="grid grid-cols-[2fr_1fr] gap-1 h-80 sm:h-96">
                    {/* Hero (large left) */}
                    <div className="relative bg-gradient-to-br from-blue-200 to-blue-400">
                        {heroUrl ? (
                            <Image src={heroUrl} alt={campaignName} fill className="object-cover" />
                        ) : (
                            <PlaceholderImg />
                        )}
                    </div>

                    {/* Gallery strip (right column, up to 3) */}
                    <div className="grid grid-rows-3 gap-1">
                        {galleryUrls.slice(0, 3).map((url, i) => (
                            <div key={i} className="relative bg-gradient-to-br from-blue-100 to-blue-300">
                                <Image src={url} alt={`${campaignName} photo ${i + 2}`} fill className="object-cover" />
                            </div>
                        ))}
                        {/* Fill empty cells */}
                        {Array.from({ length: Math.max(0, 3 - galleryUrls.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Hero only — full width */
                <div className="relative h-80 sm:h-96 bg-gradient-to-br from-blue-200 to-blue-400">
                    {heroUrl ? (
                        <Image src={heroUrl} alt={campaignName} fill className="object-cover" />
                    ) : (
                        <PlaceholderImg />
                    )}
                </div>
            )}
        </div>
    );
}

function PlaceholderImg() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    );
}
