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

/* Seamless tiles derived from the Figma swatch exports (the raw swatches are
   crops with a baked border/rounded corners and don't tile). Each tile is
   either an exact measured repeat period of the pattern (geometric: both axes;
   trophy/sports/abstract: horizontal; athletic: vertical) or mirror-completed
   on the axis whose period doesn't fit inside the crop.
   `size` is the CSS background-size at the Figma hero's motif scale: its
   1920px band export repeats every 484px (sports tile intrinsic period 318px →
   ×1.522), expressed in vw so the pattern scales with the viewport exactly
   like the full-bleed reference export does (484/1920 = 25.2vw etc.). */
export const THEME_TILES: Record<string, { src: string; size: string }> = {
    athletic:    { src: "/assets/campaigns/tiles/theme-athletic-tile.png",  size: "63.3vw auto"  },
    sports:      { src: "/assets/campaigns/tiles/theme-sports-tile.png",    size: "25.2vw auto"  },
    trophy_wall: { src: "/assets/campaigns/tiles/theme-trophy-tile.png",    size: "19.65vw auto" },
    geometric:   { src: "/assets/campaigns/tiles/theme-geometric-tile.png", size: "18.65vw auto" },
    abstract:    { src: "/assets/campaigns/tiles/theme-abstract-tile.png",  size: "20.2vw auto"  },
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
    /** background-size that shows the tile at its intended motif scale. */
    themeSize:  string;
};

export function getMarketingTheme(c: MarketingThemeInput): MarketingTheme {
    const tile = c.background_theme ? (THEME_TILES[c.background_theme] ?? null) : null;
    return {
        accent:     c.accent_color    ?? "#0268c0",
        secondary:  c.secondary_color ?? "#003060",
        tertiary:   c.tertiary_color  ?? "#ffffff",
        themeImage: tile?.src ?? null,
        themeSize:  tile?.size ?? "217px auto",
    };
}
