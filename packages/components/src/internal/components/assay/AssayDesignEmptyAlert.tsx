import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlertWithPermissions, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';

interface Props extends EmptyAlertWithPermissionsProps {
    message?: string;
}

export const AssayDesignEmptyAlert: FC<Props> = memo(props => {
    const { message, actionURL, ...baseProps } = props;
    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={actionURL ?? NEW_ASSAY_DESIGN_HREF}
            message={message ?? 'No assays are currently active.'}
            permission={PermissionTypes.DesignAssay}
        />
    );
});
