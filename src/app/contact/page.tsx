import type { Metadata } from "next";
import MarketingDocShell from "@/components/MarketingDocShell";
import TypingText from "@/components/TypingText";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Got a question or just want to say hi? Send the FundByText team a message.",
};

export default function ContactPage() {
    return (
        <MarketingDocShell
            // No badge on the contact hero (Figma 5798:11591). The title types itself
            // out with an orange caret, like the How It Works hero. card=false because
            // ContactForm is already its own card.
            title={<TypingText text="Want to Chat" />}
            intro="Hey there! Got a question or just want to say hi? We're here to help!"
            card={false}
        >
            <ContactForm />
        </MarketingDocShell>
    );
}
