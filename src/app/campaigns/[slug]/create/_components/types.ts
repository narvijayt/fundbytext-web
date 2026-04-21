export type CsvRow = {
    first_name: string;
    last_name:  string;
    email:      string;
    phone:      string;
};

export type ImportResult = { added: number; skipped: number };

export type Donor = {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
};

export type MemberRole = { role: string };

export type Member = {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    roles: MemberRole[];
};

export type Media = {
    id: string;
    media_type: string;
    url: string;
    sort_order: number;
};

export type Payout = {
    recipient_first_name: string;
    recipient_last_name: string;
    org_name?: string | null;
    street_address: string;
    apt_suite?: string | null;
    city: string;
    state: string;
    zip: string;
};

export type Campaign = {
    id: string;
    status: "draft" | "upcoming" | "active" | "completed";
    campaign_type: "individual" | "organization";
    name: string | null;
    org_display_name: string | null;
    story: string | null;
    timezone: string | null;
    start_date: string | null;
    end_date: string | null;
    goal_type: string | null;
    goal_amount: string | null;
    donors_per_participant: number | null;
    background_theme: string;
    accent_color: string | null;
    secondary_color: string | null;
    thank_you_message: string | null;
    media: Media[];
    payout: Payout | null;
    members: Member[];
    donors: Donor[];
};

export const STEPS = [
    { num: 1, label: "Details" },
    { num: 2, label: "Funding Goal" },
    { num: 3, label: "Campaign Visual" },
    { num: 4, label: "Participants" },
    { num: 5, label: "Thank You" },
];

export const BACKGROUND_THEMES = [
    { value: "logo", label: "Branded Logo" },
    { value: "athletic", label: "Athletic" },
    { value: "sports", label: "Sports" },
    { value: "trophy_wall", label: "Trophy Wall" },
    { value: "geometric", label: "Geometric" },
    { value: "abstract", label: "Abstract" },
];
