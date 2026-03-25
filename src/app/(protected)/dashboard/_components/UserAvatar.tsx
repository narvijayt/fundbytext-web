"use client";

import { useState } from "react";
import Image from "next/image";

export default function UserAvatar({
    photoUrl,
    initial,
    name,
}: {
    photoUrl: string | null;
    initial: string;
    name: string;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
            {photoUrl && !imgError ? (
                <Image
                    src={photoUrl}
                    alt={name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="text-3xl font-bold text-orange-500">{initial}</span>
            )}
        </div>
    );
}
