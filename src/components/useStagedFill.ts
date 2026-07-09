import { useEffect, useRef, useState } from "react";

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Animates a two-segment progress fill where the green segment (raised up to the
 * initial goal) grows FIRST and the gold "overflow" segment (raised beyond it, on
 * open-ended scaling campaigns) grows AFTER it — matching the public campaign bar.
 *
 * Returns the current animated widths as percentages plus `greenDone`, which flips
 * true (and stays true) once the green segment has reached its target — used to
 * reveal the goal divider only when the fill touches it.
 *
 * On the first mount the fill is staged (green, then gold). Later target changes
 * (e.g. a live donation) ease both segments from their current value to the new
 * target simultaneously, so the bar never jumps or replays from zero.
 */
export function useStagedFill(
    greenPct: number,
    goldPct: number,
    opts?: { greenDur?: number; goldDur?: number },
) {
    const greenDur = opts?.greenDur ?? 1000;
    const goldDur  = goldPct > 0 ? (opts?.goldDur ?? 700) : 0;

    const [greenW, setGreenW]       = useState(0);
    const [goldW,  setGoldW]        = useState(0);
    const [greenDone, setGreenDone] = useState(false);

    const raf     = useRef(0);
    const mounted = useRef(false);
    const fromG   = useRef(0);
    const fromD   = useRef(0);

    useEffect(() => {
        const initial = !mounted.current;
        mounted.current = true;

        const startG = fromG.current;
        const startD = fromD.current;

        // Stage green-then-gold on first paint; ease straight to target afterwards.
        const gDur   = initial ? greenDur : 800;
        const dDelay = initial ? greenDur : 0;
        const dDur   = initial ? goldDur : (goldPct > 0 ? 800 : 0);
        const total  = Math.max(gDur, dDelay + dDur);

        let startTs: number | null = null;
        function step(now: number) {
            if (startTs === null) startTs = now;
            const el = now - startTs;

            const gp = Math.min(1, el / gDur);
            const gv = startG + easeOutCubic(gp) * (greenPct - startG);
            setGreenW(gv); fromG.current = gv;
            setGreenDone((d) => d || gp >= 1);

            const dp = dDur > 0 ? Math.min(1, Math.max(0, (el - dDelay) / dDur)) : 1;
            const dv = dDur > 0 ? startD + easeOutCubic(dp) * (goldPct - startD) : goldPct;
            setGoldW(dv); fromD.current = dv;

            if (el < total) {
                raf.current = requestAnimationFrame(step);
            } else {
                setGreenW(greenPct); fromG.current = greenPct;
                setGoldW(goldPct);   fromD.current = goldPct;
                setGreenDone(true);
            }
        }
        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [greenPct, goldPct]);

    return { greenW, goldW, greenDone };
}
