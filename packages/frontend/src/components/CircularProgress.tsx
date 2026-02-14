/**
 * @module CircularProgress
 * @description Presentational component that renders a CSS-driven circular
 * progress indicator. Uses the {@link useProgress} hook to compute the
 * percentage and bind it to a CSS custom property (`--progress`).
 */

import useProgress from "../hooks/useProgress";
import "../css/circular-progress.css";


/** Props for the {@link CircularProgress} component. */
interface ProgressProp{
    /** Current amount spent (numerator of the ratio). */
    value: number,
    /** Budgeted allotment (denominator of the ratio). */
    allotment: number
}

/**
 * Renders a circular progress ring showing `value / allotment` utilization.
 *
 * @param props - {@link ProgressProp} with `value` and `allotment`.
 */
function CircularProgress({ value, allotment }: ProgressProp) {
    const { ref } = useProgress(value, allotment);

    return (<div ref={ref} className="progress"/>);
};

export default CircularProgress;
