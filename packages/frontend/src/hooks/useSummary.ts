import { useEffect } from "react";
import type { SummaryType } from "../types/summaryType";
import type { UseCallbacks } from "../types/callbackType";


export function useSummary(userId: string | null, callBacks: UseCallbacks<SummaryType>) {
    const { onStart, onSuccess, onError} = callBacks;

    useEffect(() => {
        if (!userId) {
            onSuccess(null as any);
            return;
        }

        let isCancelled = false;
        async function fetchSummary() {
            try {
                onStart();

                const res = await fetch(`/api/user/${userId}`);
                if (!res.ok) throw new Error(`Server responded with state ${res.status}`); 

                const data: unknown = await res.json();
                if (isCancelled) return;
                onSuccess(data as SummaryType);

            } catch (err) {
                if (isCancelled) return;
                console.error(err);
                onError(`Failed to load user: ${err}`);
            }
        } 
        fetchSummary();
        return () => {isCancelled = true;};
    }, [userId]);
}
export default useSummary;

