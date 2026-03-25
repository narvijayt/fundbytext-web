export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200 px-4 py-12">
            {children}
        </main>
    );
}
