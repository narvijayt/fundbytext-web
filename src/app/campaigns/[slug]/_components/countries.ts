// Full ISO 3166-1 alpha-2 country list. Names are resolved via Intl.DisplayNames
// (available on both server and client) and flag emojis are derived from the code
// (two regional-indicator letters), so we don't ship a giant hardcoded name table.

export type Country = { code: string; name: string; flag: string };

const CODES = (
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV " +
    "BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES " +
    "ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE " +
    "IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY " +
    "MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU " +
    "NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM " +
    "SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG " +
    "VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

// Pinned to the top for convenience (donations skew to these), in this order.
const POPULAR = ["US", "CA", "GB", "AU", "IN", "DE", "FR", "MX", "BR"];

function flagEmoji(code: string): string {
    return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function nameOf(code: string): string {
    try { return regionNames?.of(code) ?? code; } catch { return code; }
}

const ALL: Country[] = CODES.map((code) => ({ code, name: nameOf(code), flag: flagEmoji(code) }));

const popularSet = new Set(POPULAR);
const popular = POPULAR.map((c) => ALL.find((x) => x.code === c)).filter(Boolean) as Country[];
const rest = ALL.filter((c) => !popularSet.has(c.code)).sort((a, b) => a.name.localeCompare(b.name));

// Popular countries first, then the rest alphabetically.
export const COUNTRIES: Country[] = [...popular, ...rest];
export const POPULAR_COUNT = popular.length;

export function countryName(code: string): string {
    return ALL.find((c) => c.code === code)?.name ?? code;
}
export function countryFlag(code: string): string {
    return flagEmoji(code);
}
