import LegalPage, { type Section } from "@/components/LegalPage";

const PRIVACY_SECTIONS: Section[] = [
    {
        title: "Information We Collect",
        lead: "We may collect the following types of personal information:",
        bullets: [
            "Personal Details: Name, email address, phone number, and billing details.",
            "Technical Data: IP address, browser type, device information, and cookies.",
            "Usage Data: Pages visited, interactions, and preferences.",
        ],
    },
    {
        title: "How We Use Your Information",
        lead: "We use the information collected for the following purposes:",
        bullets: [
            "To provide and improve our services.",
            "To process transactions and manage user accounts.",
            "To personalize user experience and deliver relevant content.",
            "To ensure security and prevent fraudulent activities.",
            "To comply with legal and regulatory requirements.",
        ],
    },
    {
        title: "Data Sharing & Third-Party Services",
        bullets: [
            "We do not sell your personal data to third parties.",
            "We may share information with service providers who assist in website operations, payment processing, and analytics.",
            "Third-party cookies may be used for analytics and advertising purposes.",
        ],
    },
    {
        title: "Data Security",
        body: "We implement appropriate security measures to protect your personal data from unauthorized access, disclosure, or loss. Payment details are handled by our PCI-compliant payment processor and are never stored on our own servers.",
    },
    {
        title: "Your Rights",
        lead: "You have the right to:",
        bullets: [
            "Access, update, or delete your personal data.",
            "Withdraw consent for data processing.",
            "Request a copy of the data we hold about you.",
            "Opt out of marketing communications.",
        ],
    },
    {
        title: "Cookies & Tracking Technologies",
        body: "Our website uses cookies to enhance user experience. Please refer to our Cookie Policy for more details on managing cookies.",
    },
    {
        title: "Changes to This Policy",
        body: "We may update this Privacy Policy from time to time. Any changes will be posted on this page, and continued use of our services implies acceptance of the revised policy.",
    },
];

export const metadata = { title: "Privacy Policy — FundByText" };

export default function PrivacyPolicyPage() {
    return (
        <LegalPage
            badge="Protecting Your Privacy"
            title="Privacy Policy"
            intro="This Privacy Policy explains how we collect, use, and protect your personal information when you use our services. By accessing our website, you agree to the terms outlined in this policy."
            sections={PRIVACY_SECTIONS}
        />
    );
}
