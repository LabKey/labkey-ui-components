/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { EmptyAlert, EmptyAlertWithPermissionsProps } from '../base/EmptyAlert';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';
import { useServerContext } from '../base/ServerContext';
import { getAppHomeFolderPath } from '../../app/utils';
import { useContainerUser } from '../container/actions';
import { hasAllPermissions } from '../base/models/User';

interface Props extends EmptyAlertWithPermissionsProps {
    message?: string;
}

export const AssayDesignEmptyAlert: FC<Props> = memo(props => {
    const { message, actionURL, ...baseProps } = props;
    const { container, moduleContext } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const homeContainer = useContainerUser(homeFolderPath);

    if (!homeContainer.isLoaded) {
        return null;
    }
    return (
        <EmptyAlert
            {...baseProps}
            actionURL={actionURL ?? NEW_ASSAY_DESIGN_HREF}
            message={message ?? 'No assays are currently active.'}
            allowAction={hasAllPermissions(homeContainer.user, [PermissionTypes.DesignAssay])}
        />
    );
});

AssayDesignEmptyAlert.displayName = 'AssayDesignEmptyAlert';
