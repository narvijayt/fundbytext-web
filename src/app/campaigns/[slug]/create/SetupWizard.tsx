"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DeleteCampaignButton from "@/app/(protected)/dashboard/_components/DeleteCampaignButton";
import { type Campaign, type Payout, type Member, type Donor, type CsvRow, type ImportResult, STEPS } from "./_components/types";
import { ProgressBar, BottomNav, RocketIcon } from "./_components/WizardNav";
import { PAGE_GRADIENT, VectorWallpaper, StepBanner, Loader, AlertDialog } from "./_components/ui";
import StepDetails      from "./_components/StepDetails";
import StepFundingGoal  from "./_components/StepFundingGoal";
import StepVisual       from "./_components/StepVisual";
import StepParticipants from "./_components/StepParticipants";
import StepThankYou     from "./_components/StepThankYou";
import { downscaleImage, DOWNSCALE_PRESETS } from "./_components/downscaleImage";

// ── Helpers ────────────────────────────────────────────────────────────────

function getMediaUrl(media: Campaign["media"], type: string): string | null {
    return media.find((m) => m.media_type === type)?.url ?? null;
}
function getGalleryUrls(media: Campaign["media"]): string[] {
    // Rebuild the gallery by its saved slot index (sort_order) so a photo stays
    // in the box it was uploaded to — empty slots in between are preserved as "".
    const slots: string[] = [];
    for (const m of media) {
        if (m.media_type === "gallery") slots[m.sort_order] = m.url;
    }
    for (let i = 0; i < slots.length; i++) if (slots[i] == null) slots[i] = "";
    return slots;
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
    const [customBgUrl, setCustomBgUrl] = useState<string | null>(campaign.custom_background_url ?? null);
    // Colours: the custom box and the logo box are independent. `customColors`
    // is what the user picks; `extractedColors` is pulled from the logo. The
    // APPLIED colours (saved + shown in the preview) derive from the active mode,
    // so editing one box never changes the other.
    const [customColors, setCustomColors] = useState<[string, string, string]>([
        campaign.accent_color    ?? "#0268C0",
        campaign.secondary_color ?? "#003060",
        campaign.tertiary_color  ?? "#FFFFFF",
    ]);
    const [colorMode, setColorMode]           = useState<"logo" | "custom">("custom");
    const [extractedColors, setExtractedColors] = useState<[string, string, string] | null>(null);
    const appliedColors = colorMode === "logo" && extractedColors ? extractedColors : customColors;
    const [accentColor, secondaryColor, tertiaryColor] = appliedColors;
    function setCustomColor(i: number, hex: string) {
        setCustomColors((prev) => { const n = [...prev] as [string, string, string]; n[i] = hex; return n; });
    }
    const [uploadingPhoto, setUploadingPhoto]   = useState<string | null>(null);

    // ── Step 4 — Participants / Donors
    const [members, setMembers]   = useState<Member[]>(campaign.members);
    const [addFirst, setAddFirst] = useState("");
    const [addLast, setAddLast]   = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addPhone, setAddPhone] = useState("");
    const [addPhotoUrl, setAddPhotoUrl] = useState<string | null>(null);
    const [addingMember, setAddingMember] = useState(false);
    // UI-only: when on, the add/participant rows show a profile-photo upload slot.
    // (Not a persisted permission — photos themselves live on each member.)
    const [allowParticipantPhoto, setAllowParticipantPhoto] = useState(true);

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
    const [confirmOpen,  setConfirmOpen]  = useState(false);
    const [confirmShown, setConfirmShown] = useState(false);
    const [exiting, setExiting]     = useState(false);
    const [alertMsg, setAlertMsg]   = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const topRef = useRef<HTMLDivElement>(null);

    // ── Step 3 auto-save — visuals (photos, colours, theme) are persisted on
    // every change so the live "Preview your Campaign page" link is always
    // current. Debounced + cancellable so rapid edits coalesce into one save.
    const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autosaveArmed = useRef(false);
    function cancelAutosave() {
        if (autosaveTimer.current) { clearTimeout(autosaveTimer.current); autosaveTimer.current = null; }
    }

    // Validation errors are shown inline next to each field — just bring the
    // first one into view (the error <p>s carry a data-field-error marker).
    function scrollToFirstError() {
        setTimeout(() => {
            document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
    }

    // True when the chosen end datetime (interpreted in the campaign's timezone)
    // is at or before "now" — used to stop a campaign launching after it's
    // already over. Maps a launch-time error field back to the step it lives on
    // so we can jump there (errors on other steps aren't otherwise visible).
    const endInPast = (local: string) => {
        if (!local) return false;
        const iso = localToUTCISO(local, timezone);
        return !!iso && new Date(iso).getTime() <= Date.now();
    };
    const STEP_OF_FIELD: Record<string, number> = {
        name: 1, org_display_name: 1, start_date: 1, end_date: 1,
        goal_type: 2, goal_amount: 2, donors_per_participant: 2,
        pay_first: 2, pay_last: 2, pay_street: 2, pay_city: 2, pay_state: 2, pay_zip: 2,
        profile: 3, hero: 3, thank_you: 5,
    };
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
                    setAlertMsg(typeof json.error === "string" ? json.error : "Failed to save.");
                }
                return false;
            }
            return true;
        } catch {
            setAlertMsg("Network error. Please try again.");
            return false;
        } finally {
            setSaving(false);
        }
    }

    // `type` is the server media type (profile|hero|gallery). `key` identifies
    // which box is uploading for the spinner — gallery boxes all share the
    // "gallery" type but need distinct keys so only the picked one spins.
    async function uploadPhoto(file: File, type: string, key?: string): Promise<string | null> {
        setUploadingPhoto(key ?? type);
        try {
            // Shrink the photo client-side before upload so we never store or
            // render multi-megapixel originals — that decode/paint cost is what
            // made this step lag once all photos were added.
            const optimized = await downscaleImage(file, DOWNSCALE_PRESETS[type as keyof typeof DOWNSCALE_PRESETS] ?? DOWNSCALE_PRESETS.gallery);
            const fd = new FormData();
            fd.append("photo", optimized);
            fd.append("type", type);
            const res  = await fetch("/api/v1/upload/campaign-photo", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok) { setAlertMsg(json.error ?? "Upload failed."); return null; }
            return json.url as string;
        } catch {
            setAlertMsg("Upload failed. Please try again.");
            return null;
        } finally {
            setUploadingPhoto(null);
        }
    }

    // Debounced auto-save of Step 3 visuals. Armed after the first render so the
    // initial mount (no change yet) doesn't trigger a save; every later change to
    // a photo / colour / theme schedules a silent PATCH so the live preview stays
    // in sync. Cancelled by explicit saves (saveVisual / saveAllDraft).
    useEffect(() => {
        if (!autosaveArmed.current) { autosaveArmed.current = true; return; }
        cancelAutosave();
        autosaveTimer.current = setTimeout(() => {
            const media: { media_type: string; url: string; sort_order: number }[] = [];
            if (profileUrl) media.push({ media_type: "profile", url: profileUrl, sort_order: 0 });
            if (heroUrl)    media.push({ media_type: "hero",    url: heroUrl,    sort_order: 0 });
            galleryUrls.forEach((u, i) => { if (u) media.push({ media_type: "gallery", url: u, sort_order: i }); });
            const data: Record<string, unknown> = {
                background_theme:      bgTheme,
                custom_background_url: customBgUrl,
                accent_color:          accentColor,
                secondary_color:       secondaryColor,
                tertiary_color:        tertiaryColor,
            };
            // Always send media — including an empty array — so removing the last
            // photo (e.g. the logo) clears it server-side and deletes its blob,
            // instead of leaving the old record/file behind.
            data.media = media;
            setAutosaveStatus("saving");
            fetch(`/api/v1/campaigns/${slug}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(data),
            })
                .then((res) => setAutosaveStatus(res.ok ? "saved" : "idle"))
                .catch(() => setAutosaveStatus("idle"));
        }, 800);
        return cancelAutosave;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileUrl, heroUrl, galleryUrls, bgTheme, customBgUrl, customColors, extractedColors, colorMode]);

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
        if (!startDate)                                  errs.start_date = "Start date is required.";
        if (!endDate)                                    errs.end_date = "End date is required.";
        else if (startDate && endDate <= startDate)      errs.end_date = "End date must be after the start date.";
        else if (endInPast(endDate))                     errs.end_date = "End date can't be in the past.";
        if (Object.keys(errs).length) { setFieldErrors(errs); scrollToFirstError(); return; }
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
        if (isOrg && !donorsPerParticipant) errs.donors_per_participant = goalType === "participant_goal"
            ? "Target contacts per participant is required."
            : "Donors per participant is required.";
        if (!payout.recipient_first_name) errs.pay_first  = "First name is required.";
        if (!payout.recipient_last_name)  errs.pay_last   = "Last name is required.";
        if (!payout.street_address)       errs.pay_street = "Street address is required.";
        if (!payout.city)                 errs.pay_city   = "City is required.";
        if (!payout.state)                errs.pay_state  = "State is required.";
        if (!payout.zip)                  errs.pay_zip    = "ZIP is required.";
        if (Object.keys(errs).length) { setFieldErrors(errs); scrollToFirstError(); return; }
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
            // Org name is only collected for a shared Organization Goal — null it
            // out for individual and participant-goal campaigns (matches Figma).
            org_name:             (isOrg && goalType !== "participant_goal") ? (payout.org_name || undefined) : null,
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
        // If validation fails, leave the pending auto-save in place so the visual
        // changes still persist; only cancel it once we're committing a full save.
        if (Object.keys(errs).length) { setFieldErrors(errs); scrollToFirstError(); return; }
        setFieldErrors({});
        cancelAutosave();
        const media: { media_type: string; url: string; sort_order: number }[] = [];
        if (profileUrl) media.push({ media_type: "profile", url: profileUrl, sort_order: 0 });
        media.push({ media_type: "hero", url: heroUrl!, sort_order: 0 });
        galleryUrls.forEach((u, i) => { if (u) media.push({ media_type: "gallery", url: u, sort_order: i }); });
        const ok = await patch({
            background_theme:      bgTheme,
            custom_background_url: customBgUrl,
            accent_color:     accentColor,
            secondary_color:  secondaryColor,
            tertiary_color:   tertiaryColor,
            media,
            current_step: 4,
        });
        if (ok) advance();
    }

    async function saveAllDraft() {
        cancelAutosave();
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
            background_theme:      bgTheme,
            custom_background_url: customBgUrl,
            accent_color:      accentColor,
            secondary_color:   secondaryColor,
            tertiary_color:    tertiaryColor,
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
        galleryUrls.forEach((u, i) => { if (u) media.push({ media_type: "gallery", url: u, sort_order: i }); });
        data.media = media; // send even when empty so removals persist + orphan blobs are cleaned
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
        if (exiting) return;
        setExiting(true);
        // Wait for the draft to finish saving before leaving — and keep the
        // loader visible for a beat even when the save is instant, so the user
        // sees their progress is being saved rather than a jarring redirect.
        await Promise.all([saveAllDraft(), new Promise((r) => setTimeout(r, 700))]);
        router.push(isEditMode || isLaunched ? `/dashboard/campaigns/${slug}` : "/dashboard");
        // `exiting` stays true so the loader persists until navigation completes.
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
        if (isOrg && !orgDisplayName.trim()) errs.org_display_name = "Organization display name is required.";
        if (!startDate)                   errs.start_date  = "Start date is required.";
        if (!endDate)                     errs.end_date    = "End date is required.";
        else if (startDate && endDate <= startDate) errs.end_date = "End date must be after the start date.";
        else if (endInPast(endDate))      errs.end_date    = "End date must be in the future.";
        if (!goalType)                    errs.goal_type   = "Fundraising goal type is required.";
        if (!goalAmount)                  errs.goal_amount = "Fundraising goal amount is required.";
        if (isOrg && !donorsPerParticipant) errs.donors_per_participant = goalType === "participant_goal"
            ? "Target contacts per participant is required."
            : "Donors per participant is required.";
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
            // A launch error can belong to an earlier step than this final one —
            // jump to the first offending step so the user can see and fix it.
            const target = Math.min(...Object.keys(errs).map((k) => STEP_OF_FIELD[k] ?? 5));
            if (target !== step) setStep(target);
            scrollToFirstError();
            return;
        }
        // Everything checks out — confirm before going live.
        setFieldErrors({});
        setConfirmOpen(true);
    }

    function closeConfirm() { setConfirmShown(false); window.setTimeout(() => setConfirmOpen(false), 200); }

    async function confirmLaunch() {
        closeConfirm();
        const saved = await patch({ thank_you_message: thankYou.trim() });
        if (!saved) return;

        setLaunching(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${slug}/launch`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) { setAlertMsg(json.error ?? "Could not launch campaign."); return; }
            router.push("/dashboard?launched=1");
            router.refresh();
        } catch {
            setAlertMsg("Network error. Please try again.");
        } finally {
            setLaunching(false);
        }
    }

    // Entrance animation + scroll-lock + Escape for the launch confirm dialog.
    useEffect(() => {
        if (!confirmOpen) return;
        const raf = requestAnimationFrame(() => setConfirmShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeConfirm(); };
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmOpen]);

    // ── Participant / Donor API calls ──────────────────────────────────────

    async function addParticipant() {
        if (!addFirst || !addLast || !addEmail) {
            setAlertMsg("First name, last name, and email are required (email is used to create their account).");
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
                    profile_photo_url: addPhotoUrl,
                }),
            });
            const json = await res.json();
            if (!res.ok) { setAlertMsg(json.error ?? "Could not add participant."); return; }
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
            setAddFirst(""); setAddLast(""); setAddEmail(""); setAddPhone(""); setAddPhotoUrl(null);
        } catch {
            setAlertMsg("Network error.");
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
            setAlertMsg(json.error ?? "Could not remove participant.");
        }
    }

    async function addDonor() {
        if (!dFirst || !dLast || !dEmail) { setAlertMsg("First name, last name, and email are required."); return; }
        if (donors.some((d) => d.email?.toLowerCase() === dEmail.trim().toLowerCase())) {
            setAlertMsg("A donor with this email has already been added.");
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
            if (!res.ok) { setAlertMsg(json.error ?? "Could not add donor."); return; }
            setDonors((prev) => [...prev, json.donor]);
            setDFirst(""); setDLast(""); setDEmail(""); setDPhone("");
        } catch {
            setAlertMsg("Network error.");
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
            setAlertMsg(json.error ?? "Could not remove donor.");
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

    // ── Step 4 — participant-photo permission + inline edits ────────────────

    type PersonField = "first_name" | "last_name" | "email" | "phone";
    type PersonFields = { first_name: string; last_name: string; email: string | null; phone: string | null };

    // Upload a profile photo (used by the participant photo slots). Returns the
    // blob URL, or null on failure. The URL is then stored on the member record.
    async function uploadProfilePhoto(file: File): Promise<string | null> {
        try {
            const optimized = await downscaleImage(file, DOWNSCALE_PRESETS.profile);
            const fd = new FormData();
            fd.append("photo", optimized);
            const res  = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok) { setAlertMsg(json.error ?? "Photo upload failed."); return null; }
            return json.url as string;
        } catch {
            setAlertMsg("Photo upload failed. Please try again.");
            return null;
        }
    }

    // Set / clear a saved participant's profile photo (optimistic + persisted).
    function setParticipantPhoto(id: string, url: string | null) {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, profile_photo_url: url } : m)));
        fetch(`/api/v1/campaigns/${slug}/members/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ profile_photo_url: url }),
        }).then(async (res) => {
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setAlertMsg(typeof json.error === "string" ? json.error : "Could not update photo.");
            }
        }).catch(() => setAlertMsg("Network error. Please try again."));
    }

    // Optimistic local edit — keeps the row title / status icon live as the user
    // types (the actual persist happens on blur/collapse, only when valid).
    function editDonorField(id: string, field: PersonField, value: string) {
        setDonors((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    }
    function editParticipantField(id: string, field: PersonField, value: string) {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    }

    async function saveDonor(id: string, f: PersonFields) {
        try {
            const res = await fetch(`/api/v1/campaigns/${slug}/donors/${id}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    first_name: f.first_name.trim(),
                    last_name:  f.last_name.trim(),
                    email:      f.email?.trim() || null,
                    phone:      f.phone?.trim() || null,
                }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setAlertMsg(typeof json.error === "string" ? json.error : "Could not update donor.");
            }
        } catch {
            setAlertMsg("Network error. Please try again.");
        }
    }

    async function saveParticipant(id: string, f: PersonFields) {
        try {
            const res = await fetch(`/api/v1/campaigns/${slug}/members/${id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    first_name: f.first_name.trim(),
                    last_name:  f.last_name.trim(),
                    email:      f.email?.trim() || null,
                    phone:      f.phone?.trim() || null,
                }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setAlertMsg(typeof json.error === "string" ? json.error : "Could not update participant.");
            }
        } catch {
            setAlertMsg("Network error. Please try again.");
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────

    const STEP_META: Record<number, { title: string; subtitle: string }> = {
        1: { title: "Campaign Details",   subtitle: "On your mark get set… Go!" },
        2: { title: "Funding Goal",       subtitle: "Set your sights high!" },
        3: { title: "Campaign Visuals",   subtitle: "Make it shine!" },
        4: isOrg
            ? { title: "Add Participants", subtitle: "Invite participants to boost your reach" }
            : { title: "Add Donors",       subtitle: "Reaching out to more donors will increase your campaign's success!" },
        5: { title: "Thank You Note",     subtitle: "Write a heartfelt message for your donors" },
    };
    const meta = STEP_META[step] ?? STEP_META[1];

    return (
        <div className="wizard-shell relative isolate min-h-screen pb-28" style={{ background: PAGE_GRADIENT }} ref={topRef}>

            <VectorWallpaper />

            {/* ── Top header bar + progress bar — single shared white background,
            so no seam/gap shows the page background between them ───────── */}
            <div className="relative z-40 bg-white w-full">
                <div className="h-15.5 md:h-22 mb-2 md:mb-4">
                    <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-10">
                        <button
                            type="button"
                            onClick={() => router.push(isEditMode || isLaunched ? `/dashboard/campaigns/${slug}` : "/dashboard")}
                            className="flex items-center transition-opacity hover:opacity-70 shrink-0"
                        >
                            <Image
                                src="/assets/campaigns/app-logo.svg"
                                width={34}
                                height={48}
                                alt="FundbyText"
                                className="app-logo w-5.25 h-7.5 md:w-8.5 md:h-12"
                            />
                        </button>
                        <h1
                            className="text-center font-black text-base md:text-[24px]"
                            style={{ color: "rgba(0,79,149,1)", lineHeight: "115%", letterSpacing: 0 }}
                        >
                            {isEditMode || isLaunched ? "Edit Your" : "Create Your"} Campaign
                        </h1>
                        <p className="shrink-0 text-right font-sans font-black text-[9px] md:text-sm leading-none tracking-[1px] uppercase text-[rgba(87,114,141,1)]">
                            STEP{" "}
                            <span className="text-[#26BA58]">{step}</span>
                            {" "}/{" "}
                            <span>5</span>
                        </p>
                    </div>
                </div>

                <ProgressBar step={step} maxStep={maxStep} isOrg={isOrg} onStepClick={goToStep} />
            </div>

            {/* ── Step banner — CSS plaque + ribbon with the step's own
            title/subtitle as text (Step 4 shows "Add Donors" / "Add Participants"). ── */}
            <div className="relative px-6 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
                <div className="relative z-10 flex justify-center">
                    <StepBanner title={meta.title} subtitle={meta.subtitle} />
                </div>
            </div>

            {/* ── Step content ────────────────────────────────────────── */}
            <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 pt-5">

                {/* Fullscreen launch loader */}
                {launching && (
                    <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                        <Loader className="w-14 h-14 mb-4" />
                        <p className="text-base font-bold text-gray-800">Launching your campaign…</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                    </div>
                )}

                {/* Launch confirmation */}
                {confirmOpen && (() => {
                    let startsInFuture = false;
                    let startLabel: string | null = null;
                    try {
                        if (startDate) {
                            const at = new Date(localToUTCISO(startDate, timezone));
                            if (!Number.isNaN(at.getTime())) {
                                startsInFuture = at.getTime() > Date.now();
                                startLabel = new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(at);
                            }
                        }
                    } catch { /* keep defaults */ }
                    return (
                        <div className={`fixed inset-0 z-[190] flex items-center justify-center p-4 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${confirmShown ? "opacity-100" : "opacity-0"}`} onClick={closeConfirm}>
                            <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className={`w-full max-w-md overflow-hidden rounded-[20px] bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)] transition-all duration-200 motion-reduce:transition-none ${confirmShown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}>
                                <div className="flex flex-col items-center px-6 pt-8 text-center sm:px-8">
                                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0px_16px_28px_-12px_rgba(38,186,88,0.6)]" style={{ background: "linear-gradient(76.24deg, #26BA58 1.19%, #34D56A 98.81%)" }}>
                                        <RocketIcon className="h-7 w-[21px]" />
                                    </span>
                                    <h2 className="text-[20px] font-black text-[#003060] sm:text-[22px]">Ready to launch?</h2>
                                    <p className="mt-2 text-[14px] leading-relaxed text-[#5b6b7c]">
                                        {startsInFuture && startLabel
                                            ? <>Your campaign is all set — it’ll go live on <span className="font-semibold text-[#003060]">{startLabel}</span>.</>
                                            : <>Your campaign is all set and will <span className="font-semibold text-[#003060]">go live right away</span>, ready to receive donations.</>}
                                    </p>
                                </div>
                                <div className="px-6 pt-5 sm:px-8">
                                    <ul className="space-y-2.5 rounded-[14px] bg-[#f5f8fb] px-4 py-3.5 text-left">
                                        {["Your campaign page becomes shareable", "Everyone you’ve added gets notified", "You can manage it anytime from your dashboard"].map((t) => (
                                            <li key={t} className="flex items-start gap-2.5 text-[13px] leading-snug text-[#42566b]">
                                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#26BA58]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex gap-3 px-6 pb-6 pt-5 sm:px-8">
                                    <button type="button" onClick={closeConfirm} className="flex-1 rounded-[12px] border border-[#d9e2ec] bg-white py-3 text-[14px] font-bold text-[#003060] transition-colors hover:bg-[#f1f5f9]">Not yet</button>
                                    <button type="button" onClick={confirmLaunch} className="flex flex-[1.4] items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]" style={{ background: "linear-gradient(76.24deg, #26BA58 1.19%, #34D56A 98.81%)" }}>
                                        Launch campaign
                                        <RocketIcon className="h-[22px] w-[17px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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

                {/* Step 2 — its own question cards (no outer wrapper) */}
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

                {/* Step 3 — its own question cards (no outer wrapper) */}
                {step === 3 && (
                    <>
                        <div className="mb-2 flex h-4 items-center justify-end gap-1.5 text-[11px] sm:text-[12px] font-medium text-[#8f98a3]">
                            {autosaveStatus === "saving" && (
                                <>
                                    <Loader className="w-3.5 h-3.5" />
                                    Saving changes…
                                </>
                            )}
                        </div>
                        <StepVisual
                            isOrg={isOrg}
                            profileUrl={profileUrl} setProfileUrl={setProfileUrl}
                            heroUrl={heroUrl} setHeroUrl={setHeroUrl}
                            galleryUrls={galleryUrls} setGalleryUrls={setGalleryUrls}
                            bgTheme={bgTheme} setBgTheme={setBgTheme}
                            customBgUrl={customBgUrl} setCustomBgUrl={setCustomBgUrl}
                            accentColor={accentColor} secondaryColor={secondaryColor}
                            customColors={customColors} setCustomColor={setCustomColor}
                            colorMode={colorMode} setColorMode={setColorMode}
                            extractedColors={extractedColors} setExtractedColors={setExtractedColors}
                            uploadingPhoto={uploadingPhoto} uploadPhoto={uploadPhoto}
                            fieldErrors={fieldErrors} clearFE={clearFE}
                            slug={slug} campaignName={campaign.name}
                        />
                    </>
                )}

                {/* Step 4 — its own QuestionCard (no outer wrapper) */}
                {step === 4 && (
                    <StepParticipants
                        isOrg={isOrg} isLaunched={isLaunched}
                        organizerInfo={organizerInfo}
                        allowParticipantPhoto={allowParticipantPhoto}
                        onToggleAllowPhoto={setAllowParticipantPhoto}
                        onUploadProfilePhoto={uploadProfilePhoto}
                        members={members}
                        addFirst={addFirst} setAddFirst={setAddFirst}
                        addLast={addLast} setAddLast={setAddLast}
                        addEmail={addEmail} setAddEmail={setAddEmail}
                        addPhone={addPhone} setAddPhone={setAddPhone}
                        addPhotoUrl={addPhotoUrl} setAddPhotoUrl={setAddPhotoUrl}
                        addingMember={addingMember}
                        onAddParticipant={addParticipant}
                        onRemoveParticipant={removeParticipant}
                        onImportParticipants={importParticipants}
                        onEditParticipant={editParticipantField}
                        onSaveParticipant={saveParticipant}
                        onSetParticipantPhoto={setParticipantPhoto}
                        donors={donors}
                        dFirst={dFirst} setDFirst={setDFirst}
                        dLast={dLast} setDLast={setDLast}
                        dEmail={dEmail} setDEmail={setDEmail}
                        dPhone={dPhone} setDPhone={setDPhone}
                        addingDonor={addingDonor}
                        onAddDonor={addDonor}
                        onRemoveDonor={removeDonor}
                        onImportDonors={importDonors}
                        onEditDonor={editDonorField}
                        onSaveDonor={saveDonor}
                    />
                )}

                {/* Step 5 — its own QuestionCard (no outer wrapper) */}
                {step === 5 && (
                    <StepThankYou
                        thankYou={thankYou} setThankYou={setThankYou}
                        fieldErrors={fieldErrors} clearFE={clearFE}
                        isOrg={isOrg} goalType={goalType} orgDisplayName={orgDisplayName}
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
                exiting={exiting}
                uploadingPhoto={uploadingPhoto}
                isLaunched={isLaunched}
                onBack={back}
                onNext={handleNext}
                onLaunch={launch}
                onExit={exitAndSave}
            />

            {/* OK alert dialog — shown for non-field errors (save/network/etc.) */}
            {alertMsg && <AlertDialog message={alertMsg} onClose={() => setAlertMsg(null)} />}
        </div>
    );
}

/* AlertDialog now lives in ./_components/ui (shared across the create flow). */
