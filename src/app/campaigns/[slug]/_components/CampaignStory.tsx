"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
    story:             string;
    organizerName:     string | null;
    organizerPhotoUrl: string | null;
};

export default function CampaignStory({ story, organizerName, organizerPhotoUrl }: Props) {
    const [expanded, setExpanded] = useState(false);

    // Strip HTML tags to estimate real text length
    const textLength = story.replace(/<[^>]*>/g, "").length;
    const isLong     = textLength > 400;

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800">About this Campaign</h2>

            {story ? (
                <>
                    <div
                        className={`relative overflow-hidden transition-all duration-300 ${!expanded && isLong ? "max-h-36" : ""}`}
                    >
                        <div
                            className="text-sm text-gray-600 story-content"
                            dangerouslySetInnerHTML={{ __html: story }}
                        />
                        {!expanded && isLong && (
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none" />
                        )}
                    </div>
                    {isLong && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: "#1565C0" }}
                        >
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </>
            ) : (
                <p className="text-sm text-gray-400 italic">No description provided.</p>
            )}

            {/* Organizer */}
            {organizerName && (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        {organizerPhotoUrl ? (
                            <Image src={organizerPhotoUrl} alt={organizerName} fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
                                <span className="text-blue-600 font-bold text-sm">
                                    {organizerName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Organized by</p>
                        <p className="text-sm font-semibold text-gray-800">{organizerName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
