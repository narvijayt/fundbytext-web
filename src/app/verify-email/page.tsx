import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = {
    title: "Verify Email",
    description: "Confirm your email address to finish setting up your FundByText account.",
    robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmailClient />
        </Suspense>
    );
}
