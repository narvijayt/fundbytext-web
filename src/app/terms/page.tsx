import LegalPage, { type Section } from "@/components/LegalPage";

const TERMS_SECTIONS: Section[] = [
    { title: "Eligibility", body: "You must be at least 18 years old, or the age of majority in your jurisdiction, to create a campaign or make a donation through Fund by Text. By using the service, you confirm that the information you provide is accurate and that you are authorized to raise funds for the cause you describe." },
    { title: "How It Works", body: "Fund by Text lets organizations and individuals launch text-driven fundraising campaigns in minutes. You create a campaign, share your unique link by text, email, or social media, and supporters donate securely online. You can track every contribution in real time from your dashboard until the campaign closes." },
    { title: "Fees & Charges", body: "Fund by Text deducts a flat 15% fee from all donations to cover payment processing, platform, and marketing costs. This fee is calculated automatically, and the remaining balance is paid out to you. There are no setup or monthly fees to start a campaign." },
    { title: "Refund & Cancellation Policy", body: "Donations are generally final and non-refundable once processed. If a donation was made in error, or a campaign is found to be fraudulent, contact our support team and we will review the request in line with our payment processor’s policies. Organizers may close a campaign at any time before its end date." },
    { title: "Privacy & Data Security", body: "We collect only the information needed to operate your campaign and process donations, and we protect it with industry-standard safeguards. Payment details are handled by our PCI-compliant payment processor and are never stored on our servers. See our Privacy Policy for full details." },
    { title: "Changes to Terms & Conditions", body: "We may update these Terms & Conditions from time to time to reflect changes to our service or legal requirements. Any changes will be posted on this page, and your continued use of Fund by Text after an update constitutes acceptance of the revised terms." },
    { title: "Contact Us", body: "For any questions or concerns regarding these Terms & Conditions, please contact our support team at support@fundbytext.com." },
];

export const metadata = { title: "Terms & Conditions", description: "The terms that govern your use of the FundByText fundraising service." };

export default function TermsPage() {
    return (
        <LegalPage
            badge="Understanding Our Terms & Conditions"
            title="Terms & Conditions"
            intro="Welcome to the Fund by Text service. By using this service, you agree to comply with these Terms & Conditions. Please read them carefully before proceeding."
            sections={TERMS_SECTIONS}
        />
    );
}
