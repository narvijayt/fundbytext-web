/* ── Marketing-page theme ──────────────────────────────────────────────────
   Maps the colours + background theme chosen during campaign creation onto the
   public page, matching the Step-3 "Campaign preview" mapping:
     accent     → primary brand surfaces (hero band, leaderboard band, plaque,
                  main progress fill, links)
     secondary  → darker gradient stop / secondary surfaces
     tertiary   → light highlight (defaults to white)
     themeImage → the selected background-theme pattern, overlaid on the bands
   Orange (#f47435) stays fixed for the Donate / CTA buttons. */

export const ORANGE = "#f47435";

const THEME_IMAGES: Record<string, string> = {
    athletic:    "/assets/campaigns/theme-athletic.png",
    sports:      "/assets/campaigns/theme-sports.png",
    trophy_wall: "/assets/campaigns/theme-trophy.png",
    geometric:   "/assets/campaigns/theme-geometric.png",
    abstract:    "/assets/campaigns/theme-abstract.png",
    // "logo" has no pattern — the band shows the accent colour alone.
};

export type MarketingThemeInput = {
    accent_color:     string | null;
    secondary_color:  string | null;
    tertiary_color:   string | null;
    background_theme: string | null;
};

export type MarketingTheme = {
    accent:     string;
    secondary:  string;
    tertiary:   string;
    themeImage: string | null;
};

export function getMarketingTheme(c: MarketingThemeInput): MarketingTheme {
    return {
        accent:     c.accent_color    ?? "#0268c0",
        secondary:  c.secondary_color ?? "#003060",
        tertiary:   c.tertiary_color  ?? "#ffffff",
        themeImage: c.background_theme ? (THEME_IMAGES[c.background_theme] ?? null) : null,
    };
}
