/**
 * @module useSummary
 * @description React hook that fetches and caches the user's financial summary
 * from `GET /api/user/:id`. Manages loading, error, and refetch states.
 * Re-fetches automatically when `userId`, `token`, or `refreshIndex` changes.
 */

import { useState, useEffect } from "react";
import type { SummaryType } from "../types/summaryType";


/**
 * Fetches the authenticated user's dashboard summary.
 *
 * @param userId - The user's MongoDB ObjectId string (from {@link getUserId}).
 * @param token - JWT Bearer token from localStorage.
 * @returns An object with:
 *   - `summary` — the fetched {@link SummaryType} data, or `null` while loading.
 *   - `loading` — `true` while the fetch is in flight.
 *   - `error` — error message string, or `null` on success.
 *   - `refetch` — callback to trigger a manual re-fetch (e.g., after a mutation).
 */
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
