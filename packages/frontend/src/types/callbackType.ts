/**
 * @module callbackType
 * @description Generic callback interface used by async hooks and API operations
 * to communicate lifecycle events (start, success, error) to the calling component.
 *
 * @typeParam T - The shape of the data returned on success.
 */

/** Lifecycle callbacks for async operations with a generic success payload. */
export interface UseCallbacks<T>{
    /** Called immediately when the operation begins (e.g., to show a loading spinner). */
    onStart: () => void;
    /** Called with the result data when the operation completes successfully. */
    onSuccess: (data: T) => void;
    /** Called with an error message string when the operation fails. */
    onError: (message: string) => void;
}
