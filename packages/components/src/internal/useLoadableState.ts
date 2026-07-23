/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingState } from '../public/LoadingState';

import { resolveErrorMessage } from './util/messaging';

interface ResolveErrorArgs {
    nounPlural: string;
    nounSingular: string;
    verb: string;
}

export interface LoadableState<T> {
    error: string;
    load: () => Promise<void>;
    loadingState: LoadingState;
    setError: Dispatch<SetStateAction<string>>;
    setLoadingState: Dispatch<SetStateAction<LoadingState>>;
    setValue: Dispatch<SetStateAction<T>>;
    value: T;
}

export type Loader<T> = () => Promise<T>;

export function useLoadableState<T>(loader: Loader<T>, resolveErrorArgs?: ResolveErrorArgs): LoadableState<T> {
    const [error, setError] = useState<string>(undefined);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [value, setValue] = useState<T>(undefined);
    const load = useCallback(async () => {
        setError(undefined);
        setLoadingState(LoadingState.LOADING);

        try {
            const result = await loader();
            setValue(result);
        } catch (e) {
            // Note: it's important to log the error here, because if consumers don't use the error object returned here
            // then you may not know an error happened, so this way we at least have some trace of an issue.
            console.error(e);
            const { nounPlural, nounSingular, verb } = resolveErrorArgs ?? {};
            setError(resolveErrorMessage(e, nounSingular, nounPlural, verb));
            // We set value to undefined here because it's possible we loaded something correctly once before, but the
            // loader changed and load got triggered again.
            setValue(undefined);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
    }, [loader, resolveErrorArgs]);
    const state = useMemo(
        () => ({
            error,
            load,
            loadingState,
            setError,
            setLoadingState,
            setValue,
            value,
        }),
        [error, load, loadingState, value]
    );

    useEffect(() => {
        load();
    }, [load]);

    return state;
}
