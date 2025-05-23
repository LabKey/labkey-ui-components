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
            <ResponsiveMenuButton className="samples-picklist-menu" text="Picklists" asSubMenu={asSubMenu}>
                <AddToPicklistMenuItem
                    queryModel={model}
                    user={user}
                    sampleIds={sampleIds}
                    metricFeatureArea={metricFeatureArea}
                />
                <PicklistCreationMenuItem
                    queryModel={sampleIds ? undefined : model}
                    sampleIds={sampleIds}
                    key="picklist"
                    user={user}
                    asMenuItem
                    metricFeatureArea={metricFeatureArea}
                />
            </ResponsiveMenuButton>
        </RequiresPermission>
    );
});
PicklistButton.displayName = 'PicklistButton';
