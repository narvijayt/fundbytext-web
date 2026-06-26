import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import ContactForm from "./ContactForm";

const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(255%2C255%2C255%2C0.22)'/%3E%3C/svg%3E")`;

export const metadata = { title: "Contact Us — FundByText" };

export default async function ContactPage() {
    const user = await getAuthUser();

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">
            <section className="relative overflow-hidden">
                {/* Coded blue gradient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(180deg,#1f8bf5 0%,#2196fd 32%,#4aa6fe 66%,#a9d6ff 100%)",
                    }} />
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 72% 44% at 50% 22%,rgba(255,255,255,0.78) 0%,rgba(255,255,255,0.28) 40%,transparent 64%)",
                    }} />
                    <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                </div>

                <NavBar user={user} />

                <div className="relative z-10 flex flex-col items-center gap-9 lg:gap-[52px] px-4 sm:px-6 lg:px-36 pt-10 lg:pt-16 pb-16 lg:pb-24 w-full">
                    <div className="flex flex-col items-center gap-4 lg:gap-5 max-w-[698px] text-center">
                        <h1 className="font-black text-[40px] sm:text-5xl lg:text-[64px] leading-[1.1] tracking-[-1px] text-[#003060]">
                            Want to Chat<span className="font-light text-[#f47435]">|</span>
                        </h1>
                        <p className="font-medium text-[#003060] text-base lg:text-lg leading-[1.4] max-w-[578px]">
                            Hey there! Got a question or just want to say hi? We&apos;re here to help!
                        </p>
                    </div>

                    <ContactForm />
                </div>

                {/* White arch base → footer */}
                <svg className="block w-full" viewBox="0 0 1440 120" preserveAspectRatio="none"
                    style={{ height: "clamp(40px,6vw,90px)", display: "block", marginTop: -1, marginBottom: -2 }} aria-hidden="true">
                    <path d="M0,72 Q720,4 1440,72 L1440,120 L0,120 Z" fill="white" />
                </svg>
            </section>

            <SiteFooter />
        </div>
    );
}
