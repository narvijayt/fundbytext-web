import LegalPage, { type Section } from "@/components/LegalPage";

const COOKIE_SECTIONS: Section[] = [
    { title: "What Are Cookies?", body: "Cookies are small text files placed on your device when you visit our website. They help the site remember your actions and preferences over time, so you enjoy a smoother, more personalized experience each time you return." },
    { title: "Types of Cookies We Use", body: "We use essential cookies that are necessary for the site to function, performance cookies that help us understand how the site is used, and functional cookies that remember your preferences. Together they keep Fund by Text secure, reliable, and easy to use." },
    { title: "How We Use Cookies", body: "We use cookies to keep you signed in, remember your campaign and donation preferences, measure how our pages perform, and improve the overall experience. Cookies also help us detect and prevent fraudulent activity so that donations reach the right causes." },
    { title: "Managing Cookies", body: "You can control or delete cookies through your browser settings at any time. Most browsers let you block or remove cookies, though disabling essential cookies may affect how parts of the site work. Your browser’s help section explains how to manage these settings." },
    { title: "Third-Party Cookies", body: "Some cookies are set by trusted third-party services we use for payment processing, analytics, and advertising. These providers may use cookies to deliver and measure their services in accordance with their own privacy policies." },
    { title: "Changes to This Policy", body: "We may update this Cookie Policy from time to time to reflect changes in technology or the law. Any updates will be posted on this page, and continued use of our website means you accept the revised policy." },
    { title: "Contact Us", body: "For any questions or concerns regarding this Cookie Policy, please contact our support team at support@fundbytext.com." },
];

export const metadata = { title: "Cookie Policy — FundByText" };

export default function CookiePolicyPage() {
    return (
        <LegalPage
            badge="How We Use Cookies"
            title="Cookie Policy"
            intro="This Cookie Policy explains how we use cookies and similar technologies to enhance your experience when using our services. By continuing to browse our website, you consent to the use of cookies as described in this policy."
            sections={COOKIE_SECTIONS}
        />
    );
}
