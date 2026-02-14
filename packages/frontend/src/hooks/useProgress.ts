/**
 * @module useProgress
 * @description React hook that drives a CSS-based circular progress indicator.
 * Computes the percentage from `value / allotment` and sets a `--progress`
 * CSS custom property on the referenced DOM element, plus a `data-value`
 * attribute for the fraction label.
 */

import { useRef, useEffect } from "react";

/**
 * Calculates budget utilization percentage and binds it to a DOM ref.
 *
 * @param value - Current amount spent (numerator).
 * @param allotment - Budgeted allotment (denominator).
 * @returns An object containing `ref` — a React ref to attach to the progress element.
 */
const useProgress = (value: number, allotment: number) => {
    if (value == null || allotment == null) {
        console.warn("useProgress called with invalid args:", {value, allotment});
    }

    const pctStr = `${value ?? 0}/${allotment ?? 0}`;
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;

        const pct = Math.floor((value / allotment) * 100);

        ref.current.style.setProperty("--progress", pct + "%");
        ref.current.setAttribute("data-value", pctStr);

    }, [value, allotment]); // Run if either value or allotment changes

    return {ref};
}

export default useProgress;
