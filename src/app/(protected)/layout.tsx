import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import Sidebar from "./_components/Sidebar";
import ScrollToTop from "./_components/ScrollToTop";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/api/v1/auth/logout");
    }

    return (
        // h-screen + overflow-hidden pins the shell to the viewport so the sidebar
        // stays fixed and ONLY <main> scrolls (the sidebar has its own internal
        // scroll for long nav).
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <ScrollToTop />
            <Sidebar user={user} />
            {/* pt-20 on mobile clears the fixed top bar; md+ has the in-flow sidebar */}
            <main id="app-main" className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-4 pt-20 md:p-8">
                {children}
            </main>
        </div>
    );
}
