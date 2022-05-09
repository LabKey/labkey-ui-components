import { useCallback, useEffect, useState } from 'react';

export const useNotAuthorized = (identifier?: any, initialState = false) => {
    const [notAuthorized, setNotAuthorized] = useState(initialState);

    const onNotAuthorized = useCallback(() => {
        setNotAuthorized(true);
    }, [setNotAuthorized]);

    useEffect(() => {
        setNotAuthorized(initialState);
    }, [identifier, initialState]);

    return { notAuthorized, onNotAuthorized };
};

export const useNotFound = (identifier: any) => {
    const [notFound, setNotFound] = useState(false);

    const onNotFound = useCallback(() => {
        setNotFound(true);
    }, [setNotFound]);

    useEffect(() => {
        setNotFound(false);
    }, [identifier]);

    return { notFound, onNotFound };
};
