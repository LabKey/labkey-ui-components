/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useCallback } from 'react';
import { useServerContext } from '../../base/ServerContext';
import { getAppHomeFolderPath } from '../../../app/utils';
import { useAppContext } from '../../../AppContext';
import { Loader, useLoadableState } from '../../../useLoadableState';
import { LoadingState } from '../../../../public/LoadingState';

export type DataChangeCommentsRequired = {
    loadingState: LoadingState;
    requiresUserComment: boolean;
};

export const useDataChangeCommentsRequired = (): DataChangeCommentsRequired => {
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();

    const loader = useCallback<Loader<boolean>>(async () => {
        const path = getAppHomeFolderPath(container, moduleContext);
        const response = await api.folder.getAuditSettings(path);
        return !!response?.requireUserComments;
    }, [api.folder, container, moduleContext]);

    const { loadingState, value: requiresUserComment } = useLoadableState(loader);

    return { loadingState, requiresUserComment };
};
