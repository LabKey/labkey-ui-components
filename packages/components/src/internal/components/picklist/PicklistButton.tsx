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
    currentProductId?: string;
    metricFeatureArea?: string;
    model: QueryModel;
    picklistProductId?: string;
    sampleIds?: string[];
    user: User;
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user, metricFeatureArea, asSubMenu, currentProductId, picklistProductId, sampleIds } = props;

    const items = (
        <>
            <AddToPicklistMenuItem
                queryModel={model}
                user={user}
                sampleIds={sampleIds}
                metricFeatureArea={metricFeatureArea}
                currentProductId={currentProductId}
                picklistProductId={picklistProductId}
            />
            <PicklistCreationMenuItem
                queryModel={sampleIds ? undefined : model}
                sampleIds={sampleIds}
                key="picklist"
                user={user}
                asMenuItem
                metricFeatureArea={metricFeatureArea}
                currentProductId={currentProductId}
                picklistProductId={picklistProductId}
            />
        </>
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <ResponsiveMenuButton
                className="samples-picklist-menu"
                items={items}
                text="Picklists"
                asSubMenu={asSubMenu}
            />
        </RequiresPermission>
    );
});
