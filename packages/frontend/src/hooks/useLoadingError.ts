import { useContext } from "react";
import { LoadingErrorContext } from "../context/loadingErrorContext";


export function useLoadingError() {
    const ctx = useContext(LoadingErrorContext);
    if (!ctx) throw new Error("Error: useLoadingError");
    return ctx;
}

