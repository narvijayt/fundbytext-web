"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone render of campaign-wizard Step 4 (Donors / Participants) with
 * mock local state, for manual / visual design checks against Figma.
 * Visit /dev/step4-preview. Not wired into production.
 */

import { useState } from "react";
import StepParticipants from "@/app/campaigns/[slug]/create/_components/StepParticipants";
import { type Donor, type Member, type CsvRow, type ImportResult } from "@/app/campaigns/[slug]/create/_components/types";
import { PAGE_GRADIENT, VectorWallpaper, StepBanner } from "@/app/campaigns/[slug]/create/_components/ui";

let idCounter = 100;
const nextId = () => `mock-${idCounter++}`;

// Mock upload: turn the chosen file into a data URL so the avatar preview renders.
function mockUpload(file: File): Promise<string | null> {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => setTimeout(() => resolve(typeof r.result === "string" ? r.result : null), 600);
        r.onerror = () => resolve(null);
        r.readAsDataURL(file);
    });
}

export default function Step4Preview() {
    const [campaignType, setCampaignType] = useState<"individual" | "organization">("individual");
    const isOrg = campaignType === "organization";
    const [isLaunched, setIsLaunched] = useState(false);
    const [allowParticipantPhoto, setAllowParticipantPhoto] = useState(true);

    const [donors, setDonors] = useState<Donor[]>([
        { id: "d1", first_name: "Stephanie", last_name: "Smith", email: "stephanie.smith@example.com", phone: "" },
    ]);
    const [dFirst, setDFirst] = useState("");
    const [dLast, setDLast]   = useState("");
    const [dEmail, setDEmail] = useState("");
    const [dPhone, setDPhone] = useState("");

    const [members, setMembers] = useState<Member[]>([
        { id: "p1", first_name: "Stephanie", last_name: "Smith", email: "stephanie.smith@example.com", phone: "", profile_photo_url: null, roles: [{ role: "participant" }] },
    ]);
    const [addFirst, setAddFirst] = useState("");
    const [addLast, setAddLast]   = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addPhone, setAddPhone] = useState("");
    const [addPhotoUrl, setAddPhotoUrl] = useState<string | null>(null);

    type PF = "first_name" | "last_name" | "email" | "phone";

    function addDonor() {
        if (!dFirst || !dLast) return;
        setDonors((p) => [...p, { id: nextId(), first_name: dFirst, last_name: dLast, email: dEmail || null, phone: dPhone || null }]);
        setDFirst(""); setDLast(""); setDEmail(""); setDPhone("");
    }
    function addParticipant() {
        if (!addFirst || !addLast) return;
        setMembers((p) => [...p, { id: nextId(), first_name: addFirst, last_name: addLast, email: addEmail || null, phone: addPhone || null, profile_photo_url: addPhotoUrl, roles: [{ role: "participant" }] }]);
        setAddFirst(""); setAddLast(""); setAddEmail(""); setAddPhone(""); setAddPhotoUrl(null);
    }
    async function importRows(rows: CsvRow[], kind: "donor" | "participant"): Promise<ImportResult> {
        rows.forEach((r) => {
            if (kind === "donor") setDonors((p) => [...p, { id: nextId(), first_name: r.first_name, last_name: r.last_name, email: r.email || null, phone: r.phone || null }]);
            else setMembers((p) => [...p, { id: nextId(), first_name: r.first_name, last_name: r.last_name, email: r.email || null, phone: r.phone || null, profile_photo_url: null, roles: [{ role: "participant" }] }]);
        });
        return { added: rows.length, skipped: 0 };
    }

    const meta = isOrg
        ? { title: "Add Participants", subtitle: "Invite participants to boost your reach" }
        : { title: "Add Donors", subtitle: "Reaching out to more donors will increase your campaign's success!" };

    return (
        <div className="wizard-shell relative isolate min-h-screen pb-28" style={{ background: PAGE_GRADIENT }}>
            <VectorWallpaper />

            <div className="relative z-40 flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Step 4 sandbox</span>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isOrg} onChange={(e) => setCampaignType(e.target.checked ? "organization" : "individual")} />
                    Org campaign (participants)
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isLaunched} onChange={(e) => setIsLaunched(e.target.checked)} />
                    Launched (locked)
                </label>
            </div>

            <div className="relative flex justify-center px-6 pt-10 pb-8">
                <StepBanner title={meta.title} subtitle={meta.subtitle} />
            </div>

            <div className="mx-auto w-full max-w-2xl px-4 pt-5 lg:max-w-3xl xl:max-w-4xl">
                <StepParticipants
                    isOrg={isOrg} isLaunched={isLaunched}
                    organizerInfo={{ first_name: "Alex", last_name: "Organizer", email: "alex@example.com", phone: "2145550000" }}
                    allowParticipantPhoto={allowParticipantPhoto}
                    onToggleAllowPhoto={setAllowParticipantPhoto}
                    onUploadProfilePhoto={mockUpload}
                    members={members}
                    addFirst={addFirst} setAddFirst={setAddFirst}
                    addLast={addLast} setAddLast={setAddLast}
                    addEmail={addEmail} setAddEmail={setAddEmail}
                    addPhone={addPhone} setAddPhone={setAddPhone}
                    addPhotoUrl={addPhotoUrl} setAddPhotoUrl={setAddPhotoUrl}
                    addingMember={false}
                    onAddParticipant={addParticipant}
                    onRemoveParticipant={(id) => setMembers((p) => p.filter((m) => m.id !== id))}
                    onImportParticipants={(rows) => importRows(rows, "participant")}
                    onEditParticipant={(id, field: PF, value) => setMembers((p) => p.map((m) => (m.id === id ? { ...m, [field]: value } : m)))}
                    onSaveParticipant={() => {}}
                    onSetParticipantPhoto={(id, url) => setMembers((p) => p.map((m) => (m.id === id ? { ...m, profile_photo_url: url } : m)))}
                    donors={donors}
                    dFirst={dFirst} setDFirst={setDFirst}
                    dLast={dLast} setDLast={setDLast}
                    dEmail={dEmail} setDEmail={setDEmail}
                    dPhone={dPhone} setDPhone={setDPhone}
                    addingDonor={false}
                    onAddDonor={addDonor}
                    onRemoveDonor={(id) => setDonors((p) => p.filter((d) => d.id !== id))}
                    onImportDonors={(rows) => importRows(rows, "donor")}
                    onEditDonor={(id, field: PF, value) => setDonors((p) => p.map((d) => (d.id === id ? { ...d, [field]: value } : d)))}
                    onSaveDonor={() => {}}
                />
            </div>
        </div>
    );
}
