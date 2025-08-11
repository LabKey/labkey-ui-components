import React, { FC, memo } from 'react';
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

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <ResponsiveMenuButton asSubMenu={asSubMenu} className="samples-picklist-menu" text="Picklists">
                <AddToPicklistMenuItem
                    metricFeatureArea={metricFeatureArea}
                    queryModel={model}
                    sampleIds={sampleIds}
                    user={user}
                />
                <PicklistCreationMenuItem
                    asMenuItem
                    key="picklist"
                    metricFeatureArea={metricFeatureArea}
                    queryModel={sampleIds ? undefined : model}
                    sampleIds={sampleIds}
                    user={user}
                />
            </ResponsiveMenuButton>
        </RequiresPermission>
    );
});
PicklistButton.displayName = 'PicklistButton';
