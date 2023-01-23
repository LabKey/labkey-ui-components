import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlertWithPermissions, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';
import { useServerContext } from "../base/ServerContext";
import { isAppHomeFolder } from "../../app/utils";

interface Props extends EmptyAlertWithPermissionsProps {
    message?: string;
}

export const AssayDesignEmptyAlert: FC<Props> = memo(props => {
    const { message, actionURL, ...baseProps } = props;
    const { container, moduleContext } = useServerContext();

    return (
        <EmptyAlertWithPermissions
            {...baseProps}
            actionURL={isAppHomeFolder(container, moduleContext) ? (actionURL ?? NEW_ASSAY_DESIGN_HREF) : undefined}
            message={message ?? 'No assays are currently active.'}
            permission={PermissionTypes.DesignAssay}
        />
    );
});
