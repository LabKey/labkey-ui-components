/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useState } from 'react';
import { useServerContext } from '../../base/ServerContext';
import { getAppHomeFolderPath } from '../../../app/utils';
import { useAppContext } from '../../../AppContext';

export const useDataChangeCommentsRequired = (): { requiresUserComment: boolean } => {
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();
    const [requiresUserComment, setRequiresUserComment] = useState<boolean>(false);

    useEffect(
        () => {
            (async () => {
                const path = getAppHomeFolderPath(container, moduleContext);
                try {
                    const response = await api.folder.getAuditSettings(path);
                    setRequiresUserComment(!!response?.requireUserComments);
                } catch (error) {
                    console.error('Unable to retrieve audit log settings for ' + path, error);
                }
            })();
        }, [ /** on load only */ ]);

    return { requiresUserComment };
};
