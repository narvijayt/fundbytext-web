import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Full DB-level check: verifies JWT, session not revoked, and user still exists.
    // Catches cases where the user was deleted while holding a valid token.
    const user = await getAuthUser();

    if (!user) {
        // Cannot clear cookies directly from a Server Component, so redirect through
        // the logout GET route which clears the cookie before sending to /login.
        // This prevents an infinite redirect loop caused by a stale JWT in the cookie.
        redirect("/api/v1/auth/logout");
    }

    return <>{children}</>;
}
