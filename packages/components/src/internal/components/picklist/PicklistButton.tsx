import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { User } from '../base/models/User';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { RequiresPermission } from '../base/Permissions';

import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

interface Props {
    asSubMenu?: boolean;
    currentProductId?: string;
    metricFeatureArea?: string;
    model: QueryModel;
    picklistProductId?: string;
    user: User;
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user, metricFeatureArea, asSubMenu, currentProductId, picklistProductId } = props;

    const items = (
        <>
            <AddToPicklistMenuItem
                queryModel={model}
                user={user}
                metricFeatureArea={metricFeatureArea}
                currentProductId={currentProductId}
                picklistProductId={picklistProductId}
            />
            <PicklistCreationMenuItem
                selectionKey={model?.selectionKey}
                queryModel={model}
                selectedQuantity={model?.selections?.size}
                key="picklist"
                user={user}
                metricFeatureArea={metricFeatureArea}
                currentProductId={currentProductId}
                picklistProductId={picklistProductId}
            />
        </>
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <ResponsiveMenuButton id="samples-picklist-menu" items={items} text="Picklists" asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
