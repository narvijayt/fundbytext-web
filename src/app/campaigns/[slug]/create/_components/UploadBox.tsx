"use client";

export default function UploadBox({
    url,
    type,
    onUploaded,
    onRemoved,
    className = "",
    placeholder = "+ Add Photo",
    uploadingPhoto,
    uploadPhoto,
}: {
    url: string | null;
    type: string;
    onUploaded: (url: string) => void;
    onRemoved?: () => void;
    className?: string;
    placeholder?: string;
    uploadingPhoto: string | null;
    uploadPhoto: (file: File, type: string) => Promise<string | null>;
}) {
    return (
        <div className={`relative ${className}`}>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl cursor-pointer transition-colors overflow-hidden w-full h-full bg-gray-50">
                {uploadingPhoto === type ? (
                    <span className="text-xs text-gray-400">Uploading…</span>
                ) : url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs">{placeholder}</span>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uploaded = await uploadPhoto(file, type);
                        if (uploaded) onUploaded(uploaded);
                        e.target.value = "";
                    }}
                />
            </label>
            {url && onRemoved && (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoved(); }}
                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                    title="Remove image"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
