import { useCallback, useRef } from 'react';

interface UseRequestHandler {
    requestHandler: (request: XMLHttpRequest) => void;
    resetRequestHandler: () => void;
}

/**
 * React hook that encapsulates handling for aborting stale XMLHttpRequests.
 * NK: In general, I'd like to make it easier to handle aborting requests within our applications.
 * This is a first crack at it but could certainly be improved/extended before being made available more broadly.
 */
export function useRequestHandler(): UseRequestHandler {
    const requestRef = useRef<XMLHttpRequest>(undefined);

    // This requestHandler aborts prior search requests in the event that another search request is made
    const requestHandler = useCallback((request: XMLHttpRequest): void => {
        requestRef.current?.abort();
        requestRef.current = request;
    }, []);

    const resetRequestHandler = useCallback(() => {
        requestRef.current = undefined;
    }, []);

    return { requestHandler, resetRequestHandler };
}
