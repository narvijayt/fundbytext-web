"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DeleteCampaignButton from "@/app/(protected)/dashboard/_components/DeleteCampaignButton";
import { type Campaign, type Payout, type Member, type Donor, type CsvRow, type ImportResult, STEPS } from "./_components/types";
import { ProgressBar, BottomNav } from "./_components/WizardNav";
import StepDetails      from "./_components/StepDetails";
import StepFundingGoal  from "./_components/StepFundingGoal";
import StepVisual       from "./_components/StepVisual";
import StepParticipants from "./_components/StepParticipants";
import StepThankYou     from "./_components/StepThankYou";

// ── Helpers ────────────────────────────────────────────────────────────────

function getMediaUrl(media: Campaign["media"], type: string): string | null {
    return media.find((m) => m.media_type === type)?.url ?? null;
}
function getGalleryUrls(media: Campaign["media"]): string[] {
    return media.filter((m) => m.media_type === "gallery").map((m) => m.url);
}
// Convert a UTC ISO string to a datetime-local input value in the given IANA timezone
function toDateInput(iso: string | null, tz: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    // sv-SE locale gives "YYYY-MM-DD HH:mm:ss" — perfect for datetime-local after trim
    const parts = new Intl.DateTimeFormat("sv-SE", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    }).format(d);
    return parts.replace(" ", "T"); // "2026-04-30T23:59"
}

// Convert a datetime-local string ("2026-04-30T23:59") + IANA timezone → UTC ISO string
function localToUTCISO(localStr: string, tz: string): string {
    if (!localStr) return "";
    const [datePart, timePart] = localStr.split("T");
    const [year, month, day]   = datePart.split("-").map(Number);
    const [hour, minute]       = (timePart ?? "00:00").split(":").map(Number);

    // Candidate: treat as UTC (wrong value, but carries the right numbers)
    const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // What the target TZ shows for this UTC moment
    const fmt   = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", hour12: false,
    });
    const parts = fmt.formatToParts(candidate);
    const get   = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? "0");
    let tzHour  = get("hour"); if (tzHour === 24) tzHour = 0;
    const showMs = Date.UTC(get("year"), get("month") - 1, get("day"), tzHour, get("minute"));

    // Offset = what we want − what TZ shows; apply to candidate
    const offsetMs = Date.UTC(year, month - 1, day, hour, minute) - showMs;
    return new Date(candidate.getTime() + offsetMs).toISOString();
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SetupWizard({
    campaign,
    slug,
    initialStep = 1,
    isEditMode = false,
    defaultOrgDisplayName,
    hasDonations = false,
    organizerInfo,
}: {
    campaign: Campaign;
    slug: string;
    initialStep?: number;
    isEditMode?: boolean;
    defaultOrgDisplayName?: string | null;
    hasDonations?: boolean;
    organizerInfo?: { first_name: string; last_name: string; email: string; phone: string };
}) {
    const router = useRouter();

    const isLaunched = campaign.status !== "draft";
    const isUpcoming = campaign.status === "upcoming";
    const isActive   = campaign.status === "active" || campaign.status === "completed";
    // Lock when: campaign already launched with an org name, OR a previous org
    // campaign exists (defaultOrgDisplayName) — so 2nd+ campaigns are pre-filled & locked.
    const orgDisplayNameLocked =
        (!!(campaign.org_display_name) && isLaunched) ||
        !!defaultOrgDisplayName;

    // ── Step 1 — Details
    const [campaignType, setCampaignType] = useState<"individual" | "organization">(campaign.campaign_type);
    const isOrg = campaignType === "organization";
    const [name, setName]                   = useState(campaign.name ?? "");
    const [orgDisplayName, setOrgDisplayName] = useState(
        campaign.org_display_name ?? defaultOrgDisplayName ?? ""
    );
    const [story, setStory]                 = useState(campaign.story ?? "");
    const [timezone, setTimezone]           = useState(
        campaign.timezone ?? (typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York")
    );
    const [startDate, setStartDate]         = useState(toDateInput(campaign.start_date, timezone));
    const [endDate, setEndDate]             = useState(toDateInput(campaign.end_date, timezone));

    // ── Step 2 — Funding Goal
    const [goalType, setGoalType]   = useState(campaign.goal_type ?? "");
    const [goalAmount, setGoalAmount] = useState(campaign.goal_amount ?? "");
    const [donorsPerParticipant, setDonorsPerParticipant] = useState(
        campaign.donors_per_participant?.toString() ?? ""
    );
    const [payout, setPayout] = useState<Payout>({
        recipient_first_name: campaign.payout?.recipient_first_name ?? "",
        recipient_last_name:  campaign.payout?.recipient_last_name  ?? "",
        org_name:             campaign.payout?.org_name             ?? "",
        street_address:       campaign.payout?.street_address       ?? "",
        apt_suite:            campaign.payout?.apt_suite            ?? "",
        city:                 campaign.payout?.city                 ?? "",
        state:                campaign.payout?.state                ?? "",
        zip:                  campaign.payout?.zip                  ?? "",
    });

    // ── Step 3 — Visual
    const [profileUrl, setProfileUrl]   = useState<string | null>(getMediaUrl(campaign.media, "profile"));
    const [heroUrl, setHeroUrl]         = useState<string | null>(getMediaUrl(campaign.media, "hero"));
    const [galleryUrls, setGalleryUrls] = useState<string[]>(getGalleryUrls(campaign.media));
    const [bgTheme, setBgTheme]         = useState(campaign.background_theme ?? "sports");
    const [accentColor, setAccentColor]       = useState(campaign.accent_color    ?? "#1565C0");
    const [secondaryColor, setSecondaryColor] = useState(campaign.secondary_color ?? "#374151");
    const [colorMode, setColorMode]           = useState<"logo" | "custom">("custom");
    const [extractedColors, setExtractedColors] = useState<[string, string] | null>(null);
    const [uploadingPhoto, setUploadingPhoto]   = useState<string | null>(null);

    // ── Step 4 — Participants / Donors
    const [members, setMembers]   = useState<Member[]>(campaign.members);
    const [addFirst, setAddFirst] = useState("");
    const [addLast, setAddLast]   = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addPhone, setAddPhone] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    const [donors, setDonors]   = useState<Donor[]>(campaign.donors);
    const [dFirst, setDFirst]   = useState("");
    const [dLast, setDLast]     = useState("");
    const [dEmail, setDEmail]   = useState("");
    const [dPhone, setDPhone]   = useState("");
    const [addingDonor, setAddingDonor] = useState(false);

    // ── Step 5 — Thank You
    const [thankYou, setThankYou] = useState(campaign.thank_you_message ?? "");

    // ── Wizard state
    const [step,    setStep]    = useState(initialStep);
    // Launched campaigns have all steps complete — unlock all tabs immediately
    const [maxStep, setMaxStep] = useState(isLaunched ? STEPS.length + 1 : initialStep);
    const [saving, setSaving]       = useState(false);
    const [launching, setLaunching] = useState(false);
    const [toast, setToast]         = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const topRef = useRef<HTMLDivElement>(null);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    }
    function clearFE(key: string) {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const n = { ...prev };
            delete n[key];
            return n;
        });
    }

    // ── API helpers ────────────────────────────────────────────────────────

    async function patch(data: object): Promise<boolean> {
        setSaving(true);
        try {
            const [res] = await Promise.all([
                fetch(`/api/v1/campaigns/${slug}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }),
                new Promise((r) => setTimeout(r, 800)),
            ]);
            const json = await res.json();
            if (!res.ok) {
                if (res.status === 409 && json.code === "name_taken") {
                    setFieldErrors((p) => ({ ...p, name: "A campaign with this name already exists." }));
                } else {
                    showToast(typeof json.error === "string" ? json.error : "Failed to save.");
                }
                return false;
            }
            return true;
        } catch {
            showToast("Network error. Please try again.");
            return false;
        } finally {
            setSaving(false);
        }
    }

    async function uploadPhoto(file: File, type: string): Promise<string | null> {
        setUploadingPhoto(type);
        try {
            const fd = new FormData();
            fd.append("photo", file);
            fd.append("type", type);
            const res  = await fetch("/api/v1/upload/campaign-photo", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok) { showToast(json.error ?? "Upload failed."); return null; }
            return json.url as string;
        } catch {
            showToast("Upload failed. Please try again.");
            return null;
        } finally {
            setUploadingPhoto(null);
        }
    }

    function advance() {
        setStep((s) => {
            const next = s + 1;
            setMaxStep((m) => Math.max(m, next));
            return next;
        });
        topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    function back() {
        setStep((s) => s - 1);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    function goToStep(num: number) {
        setStep(num);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // ── Step savers ────────────────────────────────────────────────────────

    async function saveDetails() {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name     = "Campaign name is required.";
        if (isOrg && !orgDisplayName.trim()) errs.org_display_name = "Organization display name is required.";
        if (!endDate)                                    errs.end_date = "End date is required.";
        else if (startDate && endDate <= startDate)      errs.end_date = "End date must be after the start date.";
        if (Object.keys(errs).length) { setFieldErrors(errs); showToast("Please fill in all required fields."); return; }
        setFieldErrors({});
        const ok = await patch({
            campaign_type:    campaignType,
            name:             name.trim(),
            org_display_name: isOrg ? (orgDisplayName.trim() || null) : undefined,
            story:            story.trim() || null,
            timezone,
            start_date:       startDate ? localToUTCISO(startDate, timezone) : null,
            end_date:         localToUTCISO(endDate, timezone),
            current_step:     2,
        });
        if (ok) advance();
    }

    async function saveFundingGoal() {
        const errs: Record<string, string> = {};
        if (!goalType)   errs.goal_type   = "Please select a goal type.";
        if (!goalAmount) errs.goal_amount  = "Fundraising goal is required.";
        if (isOrg && !donorsPerParticipant) errs.donors_per_participant = "Donors per participant is required.";
        if (!payout.recipient_first_name) errs.pay_first  = "First name is required.";
        if (!payout.recipient_last_name)  errs.pay_last   = "Last name is required.";
        if (!payout.street_address)       errs.pay_street = "Street address is required.";
        if (!payout.city)                 errs.pay_city   = "City is required.";
        if (!payout.state)                errs.pay_state  = "State is required.";
        if (!payout.zip)                  errs.pay_zip    = "ZIP is required.";
        if (Object.keys(errs).length) { setFieldErrors(errs); showToast("Please fill in all required fields."); return; }
        setFieldErrors({});
        const data: Record<string, unknown> = {
            goal_type:   goalType,
            goal_amount: Number(goalAmount),
        };
        if (isOrg) {
            data.donors_per_participant = donorsPerParticipant ? Number(donorsPerParticipant) : null;
        }
        data.payout = {
            recipient_first_name: payout.recipient_first_name,
            recipient_last_name:  payout.recipient_last_name,
            org_name:             payout.org_name     || undefined,
            street_address:       payout.street_address,
            apt_suite:            payout.apt_suite    || undefined,
            city:                 payout.city,
            state:                payout.state,
            zip:                  payout.zip,
        };
        data.current_step = 3;
        const ok = await patch(data);
        if (ok) advance();
    }

    async function saveVisual() {
        const errs: Record<string, string> = {};
        if (!profileUrl) errs.profile = `${isOrg ? "Organization logo" : "Profile photo"} is required.`;
        if (!heroUrl)    errs.hero    = "A campaign photo is required.";
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }
        setFieldErrors({});
        const media: { media_type: string; url: string; sort_order: number }[] = [];
        if (profileUrl) media.push({ media_type: "profile", url: profileUrl, sort_order: 0 });
        media.push({ media_type: "hero", url: heroUrl!, sort_order: 0 });
        galleryUrls.forEach((u, i) => media.push({ media_type: "gallery", url: u, sort_order: i }));
        const ok = await patch({
            background_theme: bgTheme,
            accent_color:     accentColor,
            secondary_color:  secondaryColor,
            media,
            current_step: 4,
        });
        if (ok) advance();
    }

    async function saveAllDraft() {
        // In edit/launched mode, mandatory fields that already have a saved value
        // must not be cleared — restore from the original campaign if the user emptied them.
        const mustKeep = isEditMode || isLaunched;
        const origMedia = campaign.media;
        const origPayout = campaign.payout;

        // ── Restore cleared mandatory fields ──
        let safeEndDate    = endDate;
        let safeGoalType   = goalType;
        let safeGoalAmount = goalAmount;
        let safeHeroUrl    = heroUrl;
        let safePayout     = { ...payout };

        if (mustKeep) {
            if (!endDate && campaign.end_date) {
                safeEndDate = toDateInput(campaign.end_date, timezone);
                setEndDate(safeEndDate);
            }
            if (!goalType && campaign.goal_type) {
                safeGoalType = campaign.goal_type;
                setGoalType(safeGoalType);
            }
            if (!goalAmount && campaign.goal_amount) {
                safeGoalAmount = campaign.goal_amount;
                setGoalAmount(String(safeGoalAmount));
            }
            const origHero = getMediaUrl(origMedia, "hero");
            if (!heroUrl && origHero) {
                safeHeroUrl = origHero;
                setHeroUrl(safeHeroUrl);
            }
            if (origPayout) {
                safePayout = {
                    recipient_first_name: payout.recipient_first_name?.trim() || origPayout.recipient_first_name,
                    recipient_last_name:  payout.recipient_last_name?.trim()  || origPayout.recipient_last_name,
                    org_name:             payout.org_name?.trim()             || origPayout.org_name             || "",
                    street_address:       payout.street_address?.trim()       || origPayout.street_address,
                    apt_suite:            payout.apt_suite?.trim()            || origPayout.apt_suite            || "",
                    city:                 payout.city?.trim()                 || origPayout.city,
                    state:                payout.state?.trim()                || origPayout.state,
                    zip:                  payout.zip?.trim()                  || origPayout.zip,
                };
                setPayout(safePayout);
            }
        }

        // ── Build payload ──
        const data: Record<string, unknown> = {
            name:              name.trim() || null,
            story:             story.trim() || null,
            timezone,
            start_date:        startDate    ? localToUTCISO(startDate, timezone)    : null,
            end_date:          safeEndDate  ? localToUTCISO(safeEndDate, timezone)  : null,
            goal_type:         safeGoalType  || null,
            goal_amount:       safeGoalAmount ? Number(safeGoalAmount) : null,
            background_theme:  bgTheme,
            accent_color:      accentColor,
            secondary_color:   secondaryColor,
            thank_you_message: thankYou.trim() || null,
            current_step:      step,
        };
        if (isOrg) {
            data.org_display_name        = orgDisplayName.trim() || null;
            data.donors_per_participant  = donorsPerParticipant ? Number(donorsPerParticipant) : null;
        }
        data.payout = {
            recipient_first_name: safePayout.recipient_first_name?.trim() || null,
            recipient_last_name:  safePayout.recipient_last_name?.trim()  || null,
            org_name:             safePayout.org_name?.trim()             || null,
            street_address:       safePayout.street_address?.trim()       || null,
            apt_suite:            safePayout.apt_suite?.trim()            || null,
            city:                 safePayout.city?.trim()                 || null,
            state:                safePayout.state?.trim()                || null,
            zip:                  safePayout.zip?.trim()                  || null,
        };
        const media: { media_type: string; url: string; sort_order: number }[] = [];
        const safeProfileUrl = profileUrl ?? (mustKeep ? getMediaUrl(origMedia, "profile") : null);
        if (safeProfileUrl) media.push({ media_type: "profile", url: safeProfileUrl, sort_order: 0 });
        if (safeHeroUrl)    media.push({ media_type: "hero",    url: safeHeroUrl,    sort_order: 0 });
        galleryUrls.forEach((u, i) => media.push({ media_type: "gallery", url: u, sort_order: i }));
        if (media.length > 0) data.media = media;
        try {
            const res = await fetch(`/api/v1/campaigns/${slug}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(data),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => null);
                console.error("[saveAllDraft] failed:", res.status, JSON.stringify(json));
            }
        } catch { /* ignore */ }
    }

    async function exitAndSave() {
        await saveAllDraft();
        router.push(isEditMode || isLaunched ? `/dashboard/campaigns/${slug}` : "/dashboard");
    }

    async function handleNext() {
        if      (step === 1) await saveDetails();
        else if (step === 2) await saveFundingGoal();
        else if (step === 3) await saveVisual();
        else if (step === 4) {
            const ok = await patch({ current_step: 5 });
            if (ok) advance();
        }
    }

    async function launch() {
        const errs: Record<string, string> = {};
        if (!name.trim())                 errs.name        = "Campaign name is required.";
        if (!endDate)                     errs.end_date    = "End date is required.";
        if (!goalType)                    errs.goal_type   = "Fundraising goal type is required.";
        if (!goalAmount)                  errs.goal_amount = "Fundraising goal amount is required.";
        if (!payout.recipient_first_name) errs.pay_first   = "Payout recipient first name is required.";
        if (!payout.recipient_last_name)  errs.pay_last    = "Payout recipient last name is required.";
        if (!payout.street_address)       errs.pay_street  = "Payout street address is required.";
        if (!payout.city)                 errs.pay_city    = "Payout city is required.";
        if (!payout.state)                errs.pay_state   = "Payout state is required.";
        if (!payout.zip)                  errs.pay_zip     = "Payout ZIP is required.";
        if (!profileUrl)                  errs.profile     = `${isOrg ? "Organization logo" : "Profile photo"} is required.`;
        if (!heroUrl)                     errs.hero        = "A campaign photo is required.";
        if (!thankYou.trim())             errs.thank_you   = "Thank you message is required.";
        if (Object.keys(errs).length) {
            setFieldErrors(errs);
            showToast("Please complete all required fields before launching.");
            return;
        }
        setFieldErrors({});
        const saved = await patch({ thank_you_message: thankYou.trim() });
        if (!saved) return;

        setLaunching(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${slug}/launch`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) { showToast(json.error ?? "Could not launch campaign."); return; }
            router.push("/dashboard?launched=1");
            router.refresh();
        } catch {
            showToast("Network error. Please try again.");
        } finally {
            setLaunching(false);
        }
    }

    // ── Participant / Donor API calls ──────────────────────────────────────

    async function addParticipant() {
        if (!addFirst || !addLast || (!addEmail && !addPhone)) {
            showToast("First name, last name, and email or phone are required.");
            return;
        }
        setAddingMember(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${slug}/members`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    first_name: addFirst.trim(), last_name: addLast.trim(),
                    email: addEmail.trim() || null, phone: addPhone.trim() || null,
                }),
            });
            const json = await res.json();
            if (!res.ok) { showToast(json.error ?? "Could not add participant."); return; }
            // Upsert: update existing member record if same id (organizer self-added as participant)
            setMembers((prev) => {
                const idx = prev.findIndex((m) => m.id === json.member.id);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = json.member;
                    return updated;
                }
                return [...prev, json.member];
            });
            setAddFirst(""); setAddLast(""); setAddEmail(""); setAddPhone("");
        } catch {
            showToast("Network error.");
        } finally {
            setAddingMember(false);
        }
    }

    async function removeParticipant(memberId: string) {
        const res = await fetch(`/api/v1/campaigns/${slug}/members/${memberId}`, { method: "DELETE" });
        if (res.status === 204) {
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        } else {
            const json = await res.json().catch(() => ({}));
            showToast(json.error ?? "Could not remove participant.");
        }
    }

    async function addDonor() {
        if (!dFirst || !dLast || !dEmail) { showToast("First name, last name, and email are required."); return; }
        if (donors.some((d) => d.email?.toLowerCase() === dEmail.trim().toLowerCase())) {
            showToast("A donor with this email has already been added.");
            return;
        }
        setAddingDonor(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${slug}/donors`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    first_name: dFirst.trim(), last_name: dLast.trim(),
                    email: dEmail.trim(), phone: dPhone.trim() || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) { showToast(json.error ?? "Could not add donor."); return; }
            setDonors((prev) => [...prev, json.donor]);
            setDFirst(""); setDLast(""); setDEmail(""); setDPhone("");
        } catch {
            showToast("Network error.");
        } finally {
            setAddingDonor(false);
        }
    }

    async function removeDonor(donorId: string) {
        const res = await fetch(`/api/v1/campaigns/${slug}/donors/${donorId}`, { method: "DELETE" });
        if (res.status === 204) {
            setDonors((prev) => prev.filter((d) => d.id !== donorId));
        } else {
            const json = await res.json().catch(() => ({}));
            showToast(json.error ?? "Could not remove donor.");
        }
    }

    async function importDonors(rows: CsvRow[]): Promise<ImportResult> {
        let added = 0, skipped = 0;
        for (const row of rows) {
            if (row.email && donors.some((d) => d.email?.toLowerCase() === row.email.toLowerCase())) {
                skipped++;
                continue;
            }
            try {
                const res = await fetch(`/api/v1/campaigns/${slug}/donors`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({
                        first_name: row.first_name,
                        last_name:  row.last_name,
                        email:      row.email  || undefined,
                        phone:      row.phone  || undefined,
                    }),
                });
                if (res.ok) {
                    const json = await res.json();
                    setDonors((prev) => [...prev, json.donor]);
                    added++;
                } else {
                    skipped++;
                }
            } catch {
                skipped++;
            }
        }
        return { added, skipped };
    }

    async function importParticipants(rows: CsvRow[]): Promise<ImportResult> {
        let added = 0, skipped = 0;
        for (const row of rows) {
            try {
                const res = await fetch(`/api/v1/campaigns/${slug}/members`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({
                        first_name: row.first_name,
                        last_name:  row.last_name,
                        email:      row.email || null,
                        phone:      row.phone || null,
                    }),
                });
                if (res.ok) {
                    const json = await res.json();
                    setMembers((prev) => {
                        const idx = prev.findIndex((m) => m.id === json.member.id);
                        if (idx >= 0) {
                            const updated = [...prev];
                            updated[idx] = json.member;
                            return updated;
                        }
                        return [...prev, json.member];
                    });
                    added++;
                } else {
                    skipped++;
                }
            } catch {
                skipped++;
            }
        }
        return { added, skipped };
    }

    // ── Render ─────────────────────────────────────────────────────────────

    const STEP_META: Record<number, { title: string; subtitle: string }> = {
        1: { title: "Campaign Details",   subtitle: "On your mark get set… Go!" },
        2: { title: "Funding Goal",       subtitle: "Set your sights high!" },
        3: { title: "Campaign Visuals",   subtitle: "Make it shine!" },
        4: { title: isOrg ? "Participants & Donors" : "Donors", subtitle: "Build your team!" },
        5: { title: "Thank You Note",     subtitle: "Finish strong!" },
    };
    const meta = STEP_META[step] ?? STEP_META[1];

    return (
        <div className="min-h-screen pb-28" style={{ background: "linear-gradient(180deg, #2196F3 0%, #1565C0 100%)" }} ref={topRef}>

            {/* ── Top header bar ──────────────────────────────────────── */}
            <div className="bg-white" style={{ height: 78 }}>
                <div
                    className="h-full max-w-5xl mx-auto flex items-center justify-between"
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                >
                    <button
                        type="button"
                        onClick={() => router.push(isEditMode || isLaunched ? `/dashboard/campaigns/${slug}` : "/dashboard")}
                        className="flex items-center transition-opacity hover:opacity-70 shrink-0"
                    >
                        <Image src="/assets/campaigns/app-logo.svg" width={30} height={43} alt="FundbyText" />
                    </button>
                    <h1
                        className="text-center font-black"
                        style={{ color: "rgba(0,79,149,1)", fontSize: 32, lineHeight: "115%", letterSpacing: 0 }}
                    >
                        {isEditMode || isLaunched ? "Edit Your" : "Create Your"} Campaign
                    </h1>
                    <p className="shrink-0 text-right font-sans font-black text-sm leading-none tracking-[1px] uppercase text-[rgba(87,114,141,1)]">
                        STEP{" "}
                        <span className="text-[#26BA58]">{step}</span>
                        {" "}/{" "}
                        <span>5</span>
                    </p>
                </div>
            </div>

            {/* ── Progress bar — centered, equal padding on both ends ───── */}
            <div className="bg-white w-full">
                <ProgressBar step={step} maxStep={maxStep} isOrg={isOrg} onStepClick={goToStep} />
            </div>

            {/* ── Step banner (not shown for step 4 — it renders its own banners) ── */}
            {step !== 4 && (
                <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center">
                    {/* Question-mark texture */}
                    <div
                        className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext x='10' y='44' font-size='40' font-family='sans-serif' fill='white'%3E%3F%3C/text%3E%3C/svg%3E")`,
                            backgroundSize: "60px 60px",
                        }}
                    />
                    {/* Ribbon banner */}
                    <div className="relative z-10 flex justify-center">
                        <div
                            className="px-10 py-4 text-center min-w-65"
                            style={{
                                background: "linear-gradient(180deg, #1A3F8F 0%, #0D2860 100%)",
                                borderRadius: "12px",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                            }}
                        >
                            <h2 className="text-2xl font-extrabold text-white tracking-wide">{meta.title}</h2>
                            {/* Subtitle with decorative dashes */}
                            <div className="flex items-center justify-center gap-2 mt-1.5">
                                <span className="text-blue-300 text-sm select-none">—</span>
                                <p className="text-blue-200 text-xs font-medium">{meta.subtitle}</p>
                                <span className="text-blue-300 text-sm select-none">—</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step content ────────────────────────────────────────── */}
            <div className="w-full max-w-2xl mx-auto px-4 pt-5">

                {/* Fullscreen launch loader */}
                {launching && (
                    <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                        <svg className="w-14 h-14 animate-spin text-blue-700 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <p className="text-lg font-bold text-gray-800">Launching your campaign…</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                    </div>
                )}

                {/* Step 1 — individual cards (no outer wrapper) */}
                {step === 1 && (
                    <StepDetails
                        campaignType={campaignType} setCampaignType={setCampaignType}
                        campaignTypeReadOnly
                        isOrg={isOrg}
                        name={name} setName={setName} nameReadOnly
                        orgDisplayName={orgDisplayName} setOrgDisplayName={setOrgDisplayName}
                        orgDisplayNameLocked={orgDisplayNameLocked}
                        story={story} setStory={setStory}
                        timezone={timezone} setTimezone={setTimezone}
                        startDate={startDate} setStartDate={setStartDate}
                        endDate={endDate} setEndDate={setEndDate}
                        fieldErrors={fieldErrors} clearFE={clearFE}
                        isLaunched={isLaunched} isUpcoming={isUpcoming} isActive={isActive}
                        isCompleted={campaign.status === "completed"}
                    />
                )}

                {/* Steps 2-3 — single white card with padding */}
                {(step === 2 || step === 3) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
                        {step === 2 && (
                            <StepFundingGoal
                                isOrg={isOrg}
                                goalType={goalType} setGoalType={setGoalType}
                                goalAmount={goalAmount} setGoalAmount={setGoalAmount}
                                donorsPerParticipant={donorsPerParticipant} setDonorsPerParticipant={setDonorsPerParticipant}
                                payout={payout} setPayout={setPayout}
                                orgDisplayName={orgDisplayName}
                                fieldErrors={fieldErrors} clearFE={clearFE}
                                isLaunched={isLaunched}
                            />
                        )}
                        {step === 3 && (
                            <StepVisual
                                isOrg={isOrg}
                                profileUrl={profileUrl} setProfileUrl={setProfileUrl}
                                heroUrl={heroUrl} setHeroUrl={setHeroUrl}
                                galleryUrls={galleryUrls} setGalleryUrls={setGalleryUrls}
                                bgTheme={bgTheme} setBgTheme={setBgTheme}
                                accentColor={accentColor} setAccentColor={setAccentColor}
                                secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
                                colorMode={colorMode} setColorMode={setColorMode}
                                extractedColors={extractedColors} setExtractedColors={setExtractedColors}
                                uploadingPhoto={uploadingPhoto} uploadPhoto={uploadPhoto}
                                fieldErrors={fieldErrors} clearFE={clearFE}
                                slug={slug} campaignName={campaign.name}
                            />
                        )}
                    </div>
                )}

                {/* Step 4 — manages its own banners and cards */}
                {step === 4 && (
                    <StepParticipants
                        isOrg={isOrg} isLaunched={isLaunched}
                        members={members}
                        addFirst={addFirst} setAddFirst={setAddFirst}
                        addLast={addLast} setAddLast={setAddLast}
                        addEmail={addEmail} setAddEmail={setAddEmail}
                        addPhone={addPhone} setAddPhone={setAddPhone}
                        addingMember={addingMember}
                        onAddParticipant={addParticipant}
                        onRemoveParticipant={removeParticipant}
                        onImportParticipants={importParticipants}
                        donors={donors}
                        dFirst={dFirst} setDFirst={setDFirst}
                        dLast={dLast} setDLast={setDLast}
                        dEmail={dEmail} setDEmail={setDEmail}
                        dPhone={dPhone} setDPhone={setDPhone}
                        addingDonor={addingDonor}
                        onAddDonor={addDonor}
                        onRemoveDonor={removeDonor}
                        onImportDonors={importDonors}
                        organizerInfo={organizerInfo}
                    />
                )}

                {/* Step 5 — manages its own layout */}
                {step === 5 && (
                    <StepThankYou
                        thankYou={thankYou} setThankYou={setThankYou}
                        fieldErrors={fieldErrors} clearFE={clearFE}
                        isOrg={isOrg} orgDisplayName={orgDisplayName}
                        members={campaign.members}
                    />
                )}

                {/* Delete — below the content, only for draft/upcoming */}
                {(campaign.status === "draft" || (campaign.status === "upcoming" && !hasDonations)) && (
                    <div className="mt-5 text-center">
                        <DeleteCampaignButton
                            slug={slug}
                            campaignName={campaign.name ?? null}
                            compact
                        />
                    </div>
                )}
            </div>

            <BottomNav
                step={step}
                saving={saving}
                launching={launching}
                toast={toast}
                uploadingPhoto={uploadingPhoto}
                isLaunched={isLaunched}
                onBack={back}
                onNext={handleNext}
                onLaunch={launch}
                onExit={exitAndSave}
            />
        </div>
    );
}
