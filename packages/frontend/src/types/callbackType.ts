// Want callback to give me a generic type on success :)
export interface UseCallbacks<T>{
    onStart: () => void;
    onSuccess: (data: T) => void;
    onError: (message: string) => void;
}

