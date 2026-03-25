import { getAuthUser } from "@/lib/session";
import LogoutButton from "./_components/LogoutButton";
import UserAvatar from "./_components/UserAvatar";

export default async function DashboardPage() {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 text-center">Dashboard</h1>

                {/* Avatar */}
                <div className="flex justify-center">
                    <UserAvatar
                        photoUrl={user?.profile_photo_url ?? null}
                        initial={user?.first_name?.[0]?.toUpperCase() ?? "?"}
                        name={`${user?.first_name} ${user?.last_name}`}
                    />
                </div>

                {/* User details */}
                <div className="space-y-3">
                    <Row label="Name" value={`${user?.first_name} ${user?.last_name}`} />
                    <Row label="Email" value={user?.email ?? "—"} />
                    <Row label="Role" value={user?.role ?? "—"} />
                    <Row label="ID" value={user?.id ?? "—"} mono />
                </div>

                <div className="pt-2 flex justify-center">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}

function Row({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
            <span className={`text-sm text-gray-800 ${mono ? "font-mono text-xs" : "font-medium"}`}>
                {value}
            </span>
        </div>
    );
}
