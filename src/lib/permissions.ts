// Platform-level actions. Campaign-level role checks (organizer vs participant)
// are handled at the route/service layer by querying campaign_member_roles.
export type Action =
    | "campaign:create"
    | "campaign:manage"
    | "participant:manage"
    | "admin:access";

const rules: Record<Action, string[]> = {
    "campaign:create":    ["admin", "user"],
    "campaign:manage":    ["admin", "user"],   // scoped to campaigns they own
    "participant:manage": ["admin", "user"],   // scoped to campaigns they're in
    "admin:access":       ["admin"],
};

export function can(action: Action, role: string): boolean {
    return rules[action]?.includes(role) ?? false;
}
