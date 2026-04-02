import { getAuthUser } from "@/lib/session";
import AuthCreateCampaignForm from "./AuthCreateCampaignForm";
import CreateCampaignForm from "./CreateCampaignForm";

export default async function CreateCampaignPage() {
    const user = await getAuthUser();

    if (user) {
        return <AuthCreateCampaignForm />;
    }

    return <CreateCampaignForm />;
}
