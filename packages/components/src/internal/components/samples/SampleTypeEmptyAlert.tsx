import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlert, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_SAMPLE_TYPE_HREF } from '../../app/constants';
import { useServerContext } from '../base/ServerContext';
import {
    getAppHomeFolderPath,
    getProjectDashboardSampleTypeExclusion,
    getProjectSampleTypeExclusion,
} from '../../app/utils';
import { useContainerUser } from '../container/actions';
import { hasAllPermissions } from '../base/models/User';

interface Props extends EmptyAlertWithPermissionsProps {
    hasExcludedTypes?: boolean;
    message?: string;
}

export const SampleTypeEmptyAlert: FC<Props> = memo(props => {
    const { message, ...baseProps } = props;
    const { container, moduleContext } = useServerContext();
    const excludedSampleTypes = getProjectSampleTypeExclusion(moduleContext);
    const excludedDashboardSampleTypes = getProjectDashboardSampleTypeExclusion(moduleContext);
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const homeContainer = useContainerUser(homeFolderPath);

    if (!homeContainer.isLoaded) {
        return null;
    }
    return (
        <EmptyAlert
            {...baseProps}
            actionURL={NEW_SAMPLE_TYPE_HREF}
            message={
                message ??
                (excludedSampleTypes?.length > 0 || excludedDashboardSampleTypes?.length > 0
                    ? 'No sample types available.'
                    : 'No sample types have been created.')
            }
            allowAction={hasAllPermissions(homeContainer.user, [PermissionTypes.DesignSampleSet])}
        />
    );
});
