import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import Sidebar from "./_components/Sidebar";

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
            <Sidebar user={user} />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
