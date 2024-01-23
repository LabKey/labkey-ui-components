import { useEffect, useState } from 'react';
import { useServerContext } from '../../base/ServerContext';
import { isProductProjectsEnabled, resolveModuleContext } from '../../../app/utils';
import { useAppContext } from '../../../AppContext';

export const useDataChangeCommentsRequired = (): { requiresUserComment: boolean } => {
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();
    const [requiresUserComment, setRequiresUserComment] = useState<boolean>(false);

    useEffect(
        () => {
            (async () => {
                let path = container?.path;
                if (isProductProjectsEnabled(moduleContext) && !container?.isProject) {
                    path = container?.parentPath;
                }
                try {
                    const response = await api.folder.getAuditSettings(path);
                    setRequiresUserComment(!!response?.requireUserComments);
                } catch (error) {
                    console.error("Unable to retrieve audit log settings for " + path, error);
                }
            })();
        }, [ /** on load only */ ]);

    return { requiresUserComment };
};
