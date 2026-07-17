import AuthSplash from "../_components/AuthSplash";

// Portalled to <body> — see AuthSplash. Rendered inline it lands in the (auth)
// layout's `relative z-10` slot, where the sticky NavBar (z-50) paints over it.
export default function Loading() {
    return <AuthSplash message="Loading Login…" />;
}
