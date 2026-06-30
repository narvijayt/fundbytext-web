import { redirect } from "next/navigation";

// Edit Profile is now a sidebar-triggered modal (EditProfileModal) that overlays
// the dashboard so the page behind stays visible. This standalone route — which
// used to render the modal on a blank page (the "no background" bug) — now just
// sends you back to the dashboard, where the modal opens from the user menu.
export default function ProfileRedirect() {
    redirect("/dashboard");
}
