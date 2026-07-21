/**
 * The site origin, with any trailing slash removed.
 *
 * NEXT_PUBLIC_APP_URL is routinely configured with a trailing slash (Vercel's
 * UI shows the domain that way), and every call site builds links as
 * `${APP_URL}/path` — which produced real, user-visible double slashes in
 * emails: `https://host//campaigns/my-campaign`. Normalising once here means no
 * call site has to remember, and a stray slash in the env can't come back.
 *
 * Import this instead of reading process.env.NEXT_PUBLIC_APP_URL directly.
 */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Join a path onto the site origin without doubling or dropping the slash. */
export function appUrl(path = ""): string {
    if (!path) return APP_URL;
    return `${APP_URL}/${path.replace(/^\/+/, "")}`;
}
