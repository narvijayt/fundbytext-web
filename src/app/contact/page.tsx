import type { Metadata } from "next";
import MarketingDocShell from "@/components/MarketingDocShell";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us — FundByText",
    description: "Got a question or just want to say hi? Send the FundByText team a message.",
};

export default function ContactPage() {
    return (
        <MarketingDocShell
            // No badge on the contact hero (Figma 5798:11591); an orange caret sits
            // after the title. card=false because ContactForm is already its own card.
            title={<>Want to Chat<span className="font-light text-[#f47435]">|</span></>}
            intro="Hey there! Got a question or just want to say hi? We're here to help!"
            card={false}
        >
            <ContactForm />
        </MarketingDocShell>
    );
}
