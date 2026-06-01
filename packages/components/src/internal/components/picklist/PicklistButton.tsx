/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { RequiresPermission } from '../base/Permissions';

import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { User } from '../base/models/User';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

interface Props {
    asSubMenu?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    sampleIds?: number[];
    user: User;
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user, metricFeatureArea, asSubMenu, sampleIds } = props;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getSelectedIds changes when selections changes
    const selectedRowIds = useMemo(() => sampleIds ?? model.getSelectedIds(), [sampleIds, model.selections]);

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <ResponsiveMenuButton asSubMenu={asSubMenu} className="samples-picklist-menu" text="Picklists">
                <AddToPicklistMenuItem
                    metricFeatureArea={metricFeatureArea}
                    selectedRowIds={selectedRowIds}
                    user={user}
                />
                <PicklistCreationMenuItem
                    asMenuItem
                    metricFeatureArea={metricFeatureArea}
                    selectedRowIds={selectedRowIds}
                    user={user}
                />
            </ResponsiveMenuButton>
        </RequiresPermission>
    );
});
PicklistButton.displayName = 'PicklistButton';
