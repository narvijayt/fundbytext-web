const A_LOGO_ICON = "/figma/logo-icon.svg";

export default function FundByTextLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const iconH = size === "sm" ? 28 : size === "lg" ? 46 : 36;
    const iconW = Math.round(iconH * (27.39 / 39));
    const textSz = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
    return (
        <div className="flex items-center gap-2.5">
            <img alt="" src={A_LOGO_ICON} width={iconW} height={iconH}
                style={{ width: iconW, height: iconH, display: "block" }} />
            <span className={`font-black text-white ${textSz} tracking-tight leading-none`}>
                Fund<span className="font-light">By</span>Text
            </span>
        </div>
    );
}
