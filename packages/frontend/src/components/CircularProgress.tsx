import useProgress from "../hooks/useProgress";
import "../css/circular-progress.css";


interface ProgressProp{
    value: number,
    allotment: number
}

function CircularProgress({ value, allotment }: ProgressProp) {
    const { ref } = useProgress(value, allotment); 

    return (<div ref={ref} className="progress"/>);
};

export default CircularProgress; 

