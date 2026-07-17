import PageSplash from "@/components/PageSplash";

// Root splash: covers the marketing home page while its campaign queries stream
// in, and acts as the fallback for any public route without its own loading.tsx
// (the auth flows, verify-email). Deliberately uses the generic default message —
// the splash already shows the FundbyText wordmark right above it, and every
// signed-in route under (protected) defines its own splash.
export default function Loading() {
    return <PageSplash />;
}
