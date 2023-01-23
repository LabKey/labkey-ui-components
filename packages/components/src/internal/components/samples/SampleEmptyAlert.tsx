import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlertWithPermissions, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_SAMPLE_TYPE_HREF, NEW_SAMPLES_HREF } from '../../app/constants';
import { useServerContext } from '../base/ServerContext';
import { isAppHomeFolder } from '../../app/utils';

interface Props extends EmptyAlertWithPermissionsProps {
    message?: string;
}

export const SampleEmptyAlert: FC<Props> = memo(props => {
    const { message, ...baseProps } = props;
    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={NEW_SAMPLES_HREF}
            message={message ?? 'No samples have been created.'}
            messageSuffix="to create samples."
            permission={PermissionTypes.Insert}
        />
    );
});

export const SampleTypeEmptyAlert: FC<Props> = memo(props => {
    const { message, ...baseProps } = props;
    const { container, moduleContext } = useServerContext();
    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={isAppHomeFolder(container, moduleContext) ? NEW_SAMPLE_TYPE_HREF : undefined}
            message={message ?? 'No sample types have been created.'}
            permission={PermissionTypes.DesignSampleSet}
        />
    );
});
