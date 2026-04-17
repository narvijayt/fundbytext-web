import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") redirect("/dashboard");
    return <>{children}</>;
}
