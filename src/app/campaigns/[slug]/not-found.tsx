import ErrorScreen, { PrimaryLink, SecondaryLink } from "@/components/ErrorScreen";

export const metadata = { title: "Campaign not found · FundByText" };

export default function CampaignNotFound() {
    return (
        <ErrorScreen
            code="404"
            title="Campaign not found"
            message="This campaign doesn’t exist or the link may be incorrect. If you think this is a mistake, check with whoever shared it with you."
            actions={
                <>
                    <PrimaryLink href="/">Back to home</PrimaryLink>
                    <SecondaryLink href="/dashboard">My dashboard</SecondaryLink>
                </>
            }
        />
    );
}
