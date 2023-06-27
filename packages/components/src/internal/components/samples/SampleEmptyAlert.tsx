import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlertWithPermissions, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_SAMPLE_TYPE_HREF } from '../../app/constants';
import { useServerContext } from '../base/ServerContext';
import { getProjectSampleTypeExclusion, isAppHomeFolder } from '../../app/utils';

interface Props extends EmptyAlertWithPermissionsProps {
    hasExcludedTypes?: boolean;
    message?: string;
}

export const SampleTypeEmptyAlert: FC<Props> = memo(props => {
    const { message, ...baseProps } = props;
    const { container, moduleContext } = useServerContext();
    const excludedSampleTypes = getProjectSampleTypeExclusion(moduleContext);

    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={isAppHomeFolder(container, moduleContext) ? NEW_SAMPLE_TYPE_HREF : undefined}
            message={
                message ??
                (excludedSampleTypes?.length > 0 ? 'No sample types available.' : 'No sample types have been created.')
            }
            permission={PermissionTypes.DesignSampleSet}
        />
    );
});
