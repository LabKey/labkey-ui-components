import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { App } from '../../..';
import { EmptyAlertWithPermissions, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';

interface Props extends EmptyAlertWithPermissionsProps {
    message?: string;
}

export const AssayDesignEmptyAlert: FC<Props> = memo(props => {
    const { message, ...baseProps } = props;
    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={App.NEW_ASSAY_DESIGN_HREF}
            message={message ?? 'No assays have been created.'}
            permission={PermissionTypes.DesignAssay}
        />
    );
});
