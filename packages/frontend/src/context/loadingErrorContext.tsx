import type { ReactNode } from "react";
import React, { createContext, useState} from "react";


interface LoadingErrorContextValue {
    loading: boolean;
    error: string | null;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const LoadingErrorContext = createContext<LoadingErrorContextValue | undefined>(undefined);

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

