import { useState, useEffect } from "react";
import type { SummaryType } from "../types/summaryType";


function useSummary(userId: string | null, token: string | null) {
    const [summary, setSummary] = useState<SummaryType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    useEffect(() => {
        if (!userId || !token) {
            setSummary(null);
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);

        fetch(`/api/user/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
            return res.json();
        })
        .then(data => {
            setSummary(data as SummaryType);
            setLoading(false);
        });
    }, [userId, token, refreshIndex]);

    const refetch = () => setRefreshIndex((idx) => idx + 1);
    return { summary, loading, error, refetch};
}
export default useSummary;

