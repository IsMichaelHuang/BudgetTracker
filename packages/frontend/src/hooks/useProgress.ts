import { useRef, useEffect } from "react";

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

