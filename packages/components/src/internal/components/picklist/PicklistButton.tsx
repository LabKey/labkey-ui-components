import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { User } from '../base/models/User';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { RequiresPermission } from '../base/Permissions';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

interface Props {
    model: QueryModel;
    user: User;
    metricFeatureArea?: string;
    asSubMenu?: boolean;
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user, metricFeatureArea, asSubMenu } = props;

    const items = (
        <>
            <AddToPicklistMenuItem queryModel={model} user={user} metricFeatureArea={metricFeatureArea} />
            <PicklistCreationMenuItem
                selectionKey={model?.id}
                queryModel={model}
                selectedQuantity={model?.selections?.size}
                key="picklist"
                user={user}
                metricFeatureArea={metricFeatureArea}
            />
        </>
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <ResponsiveMenuButton id="samples-picklist-menu" items={items} text="Picklists" asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
