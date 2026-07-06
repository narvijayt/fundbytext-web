import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = { title: "Verify Email · FundbyText" };

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmailClient />
        </Suspense>
    );
}
