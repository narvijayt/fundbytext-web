import ErrorScreen, { PrimaryLink, SecondaryLink } from "@/components/ErrorScreen";

export const metadata = { title: "Page not found · FundByText" };

export default function NotFound() {
    return (
        <ErrorScreen
            code="404"
            title="Page not found"
            message="The page you’re looking for doesn’t exist or may have moved. Let’s get you back on track."
            actions={
                <>
                    <PrimaryLink href="/">Back to home</PrimaryLink>
                    <SecondaryLink href="/how-it-works">How it works</SecondaryLink>
                </>
            }
        />
    );
}
