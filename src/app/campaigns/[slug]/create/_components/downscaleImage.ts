// Client-side image downscaler. Caps an uploaded image to `maxDim` on its
// longest side and re-encodes it (WebP, JPEG fallback) before it is sent to
// the server. This keeps blob payloads small so the live preview collage and
// upload boxes paint smoothly instead of decoding multi-MB full-res files.
//
// Safety contract: this NEVER throws and NEVER blocks an upload. On any
// failure (unsupported format, decode error, no canvas, animated image, etc.)
// it returns the ORIGINAL file unchanged, so the server route (which still
// validates type + 10 MB / 5 MB size) remains the source of truth. Browsers
// without canvas/toBlob support simply fall through to the original file.
//
// Must run in the browser only — call sites already live in a "use client"
// component, but we guard `typeof document` defensively so an accidental SSR
// import is a no-op rather than a crash.

export type DownscaleOpts = {
    /** Max length of the longest side, in CSS pixels. */
    maxDim: number;
    /** Preferred output type; falls back to image/jpeg if unsupported. */
    mimeType?: "image/webp" | "image/jpeg";
    /** 0–1 encoder quality. */
    quality?: number;
};

// Animated formats must be passed through untouched — re-encoding a canvas
// frame would silently flatten the animation to a single still.
const PASSTHROUGH_TYPES = new Set(["image/gif", "image/apng"]);

/** Resolve preferred mime, falling back to JPEG when WebP encode is unsupported. */
function pickMime(preferred: string): string {
    if (typeof document === "undefined") return "image/jpeg";
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    // toDataURL returns the requested type only if the browser can encode it;
    // otherwise it silently downgrades to image/png.
    const supported = canvas.toDataURL(preferred).startsWith(`data:${preferred}`);
    return supported ? preferred : "image/jpeg";
}

/** Decode a File to something drawable, honoring EXIF orientation. */
async function decode(file: File): Promise<{
    source: CanvasImageSource;
    width: number;
    height: number;
    cleanup: () => void;
}> {
    // Preferred path: createImageBitmap respects EXIF via imageOrientation and
    // decodes off the main thread.
    if (typeof createImageBitmap === "function") {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                cleanup: () => bitmap.close(),
            };
        } catch {
            // fall through to <img>
        }
    }

    // Fallback: <img> + object URL. Modern browsers auto-apply EXIF
    // orientation when an <img> is rendered, so the canvas draw is correct.
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("img decode failed"));
            el.src = url;
        });
        return {
            source: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            cleanup: () => URL.revokeObjectURL(url),
        };
    } catch (err) {
        URL.revokeObjectURL(url);
        throw err;
    }
}

export async function downscaleImage(file: File, opts: DownscaleOpts): Promise<File> {
    const { maxDim, mimeType = "image/webp", quality = 0.82 } = opts;

    // Bail out cheaply for anything we shouldn't touch.
    if (typeof document === "undefined") return file;
    if (PASSTHROUGH_TYPES.has(file.type)) return file;
    if (!file.type.startsWith("image/")) return file;

    let decoded: Awaited<ReturnType<typeof decode>> | null = null;
    try {
        decoded = await decode(file);
        const { source, width, height } = decoded;
        if (!width || !height) return file;

        const longest = Math.max(width, height);
        // Already small enough: don't re-encode (avoids needlessly recompressing
        // and possibly enlarging tiny PNGs).
        if (longest <= maxDim) return file;

        const scale = maxDim / longest;
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, 0, 0, targetW, targetH);

        const outMime = pickMime(mimeType);
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, outMime, quality)
        );
        if (!blob) return file;

        // Don't ship a *larger* file than we started with (can happen for
        // already-optimized JPEGs). Keep the original in that case.
        if (blob.size >= file.size) return file;

        const ext = outMime === "image/webp" ? "webp" : "jpg";
        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([blob], `${baseName}.${ext}`, {
            type: outMime,
            lastModified: Date.now(),
        });
    } catch {
        // Never block an upload because resizing failed.
        return file;
    } finally {
        decoded?.cleanup();
    }
}

// Per-slot presets. The server route still enforces type + size as a backstop,
// so these are an optimization, not a correctness requirement.
export const DOWNSCALE_PRESETS = {
    // Rendered small (avatar / logo chips, ~64–128px). 512 covers retina.
    profile: { maxDim: 512, mimeType: "image/webp", quality: 0.82 } as DownscaleOpts,
    // Large hero/banner cell — can span the full preview width. 1600 keeps it
    // crisp on retina without shipping 4000px phone photos.
    hero: { maxDim: 1600, mimeType: "image/webp", quality: 0.82 } as DownscaleOpts,
    // Gallery collage cells are smaller than the hero. 1200 is plenty.
    gallery: { maxDim: 1200, mimeType: "image/webp", quality: 0.82 } as DownscaleOpts,
} satisfies Record<string, DownscaleOpts>;
