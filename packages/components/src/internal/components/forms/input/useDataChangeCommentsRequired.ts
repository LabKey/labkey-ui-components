import { useEffect, useState } from 'react';
import { useServerContext } from '../../base/ServerContext';
import { isProductProjectsEnabled, resolveModuleContext } from '../../../app/utils';
import { useAppContext } from '../../../AppContext';

export const useDataChangeCommentsRequired = (): { requiresUserComment: boolean } => {
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();
    const [requiresUserComment, setRequiresUserComment] = useState<boolean>();

    useEffect(
        () => {
            (async () => {
                let path = container.path;
                if (isProductProjectsEnabled(resolveModuleContext(moduleContext)) && !container.isProject) {
                    path = container.parentPath;
                }
                const response = await api.folder.getAuditSettings(path);
                setRequiresUserComment(response.requireUserComments);
            })();
        }, [ /** on load only */]);

    return { requiresUserComment };
};
