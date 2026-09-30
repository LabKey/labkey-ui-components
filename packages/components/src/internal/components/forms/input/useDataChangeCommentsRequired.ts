/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useCallback, useState } from 'react';
import { useServerContext } from '../../base/ServerContext';
import { getAppHomeFolderPath } from '../../../app/utils';
import { useAppContext } from '../../../AppContext';
import { Loader, useLoadableState } from '../../../useLoadableState';
import { isLoading, LoadingState } from '../../../../public/LoadingState';

export type DataChangeCommentsRequired = {
    canConfirm: boolean;
    comment: string;
    loadingState: LoadingState;
    requiresUserComment: boolean;
    setComment: (comment: string) => void;
};

export const useDataChangeCommentsRequired = (commentEnabled = true): DataChangeCommentsRequired => {
    const [comment, setComment] = useState<string>();
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();

    const loader = useCallback<Loader<boolean>>(async () => {
        if (!commentEnabled) return false;
        const path = getAppHomeFolderPath(container, moduleContext);
        const response = await api.folder.getAuditSettings(path);
        return !!response?.requireUserComments;
    }, [api.folder, commentEnabled, container, moduleContext]);

    const { loadingState, value: requiresUserComment } = useLoadableState(loader);
    const canConfirm =
        !commentEnabled || ((!requiresUserComment || comment?.trim()?.length > 0) && !isLoading(loadingState));

    return { canConfirm, comment, loadingState, requiresUserComment, setComment };
};
