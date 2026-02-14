/**
 * @module useLoadingError
 * @description Convenience hook that consumes the {@link LoadingErrorContext}.
 * Provides `loading` and `error` state plus their setters to any component
 * within the {@link LoadingErrorProvider} tree.
 *
 * @throws {Error} If called outside of a {@link LoadingErrorProvider}.
 */

import { useContext } from "react";
import { LoadingErrorContext } from "../context/loadingErrorContext";


/**
 * Retrieves the global loading/error state from context.
 *
 * @returns `{ loading, error, setLoading, setError }` from {@link LoadingErrorContext}.
 * @throws {Error} If the component is not wrapped in a {@link LoadingErrorProvider}.
 */
export function useLoadingError() {
    const ctx = useContext(LoadingErrorContext);
    if (!ctx) throw new Error("Error: useLoadingError");
    return ctx;
}
