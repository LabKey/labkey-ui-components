/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { useAppContext } from '../../AppContext';
import { resolveErrorMessage } from '../../util/messaging';
import { SCHEMAS } from '../../schemas';

export interface UseCanonicalQueryName {
    error?: string;
    isLoaded: boolean;
    notFound: boolean;
    queryInfo?: QueryInfo;
    queryName?: string;
    schemaName?: string;
    schemaQuery?: SchemaQuery;
}

/**
 * Resolves a possibly wrong-case schema/query name (e.g. a route param) to the server's canonical case via the cached getQueryDetails.
 * `notFound` is set when the type does not exist, to drive a NotFound page.
 */
export function useCanonicalQueryName(
    schemaName: string,
    rawQueryName: string,
    containerPath?: string
): UseCanonicalQueryName {
    const { api } = useAppContext();
    const [queryInfo, setQueryInfo] = useState<QueryInfo>();
    const [error, setError] = useState<string>();
    const [notFound, setNotFound] = useState(false);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);

    useEffect(() => {
        setQueryInfo(undefined);
        setError(undefined);
        setNotFound(false);

        if (!schemaName || !rawQueryName) return;

        (async () => {
            setLoadingState(LoadingState.LOADING);
            try {
                const queryInfo_ = await api.query.getQueryDetails({
                    schemaName,
                    queryName: rawQueryName,
                    containerPath,
                });
                setQueryInfo(queryInfo_);
            } catch (e) {
                setNotFound(true);
                setError(resolveErrorMessage(e));
            } finally {
                setLoadingState(LoadingState.LOADED);
            }
        })();
    }, [api, schemaName, rawQueryName, containerPath]);

    return useMemo(
        () => ({
            error,
            isLoaded: !isLoading(loadingState),
            notFound,
            queryInfo,
            queryName: queryInfo?.name,
            schemaName: queryInfo?.schemaQuery?.schemaName,
            schemaQuery: queryInfo?.schemaQuery,
        }),
        [error, loadingState, notFound, queryInfo]
    );
}

export function useSampleTypeParam(containerPath?: string): UseCanonicalQueryName {
    const { sampleType } = useParams();
    return useCanonicalQueryName(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType, containerPath);
}

export function useSourceTypeParam(entityTypeKey = 'sourceType', containerPath?: string): UseCanonicalQueryName {
    const params = useParams();
    return useCanonicalQueryName(SCHEMAS.DATA_CLASSES.SCHEMA, params[entityTypeKey], containerPath);
}
