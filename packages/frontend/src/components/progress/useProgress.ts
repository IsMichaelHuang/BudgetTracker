import { useRef, useEffect } from "react";

const useProgress = (value: number, allotment: number) => {
    const pctStr = value.toString() + "/" + allotment.toString();

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

