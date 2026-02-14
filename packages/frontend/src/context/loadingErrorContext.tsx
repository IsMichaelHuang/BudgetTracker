/**
 * @module loadingErrorContext
 * @description React Context provider for global loading and error state.
 * Wraps the application (or a subtree) so that any child component can
 * read or update the shared `loading` and `error` flags via
 * {@link useLoadingError}.
 */

import type { ReactNode } from "react";
import React, { createContext, useState} from "react";


/** Shape of the value exposed by {@link LoadingErrorContext}. */
interface LoadingErrorContextValue {
    /** Whether a global async operation is in progress. */
    loading: boolean;
    /** Current error message, or `null` if no error. */
    error: string | null;
    /** Setter for the `loading` flag. */
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    /** Setter for the `error` message. */
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/** React Context holding the global loading/error state. `undefined` when consumed outside the provider. */
export const LoadingErrorContext = createContext<LoadingErrorContextValue | undefined>(undefined);

/**
 * Provider component that initializes and exposes global loading/error state.
 *
 * @param props.children - Child components that can consume the context.
 */
export function LoadingErrorProvider({children}: { children: ReactNode }) {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <LoadingErrorContext.Provider value={{ loading, error, setLoading, setError}}>
            {children}
        </LoadingErrorContext.Provider>
    );
}
export default LoadingErrorProvider;
