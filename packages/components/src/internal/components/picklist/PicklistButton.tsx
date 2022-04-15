import React, { FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { User } from '../base/models/User';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { RequiresPermission } from '../base/Permissions';
import { SubMenuItem } from '../menus/SubMenuItem';

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
                selectedQuantity={model?.selections?.size}
                key="picklist"
                user={user}
                metricFeatureArea={metricFeatureArea}
            />
        </>
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            {!asSubMenu && <DropdownButton title="Picklists" id="samples-picklist-menu">{items}</DropdownButton>}
            {asSubMenu && <SubMenuItem text="Picklists">{items}</SubMenuItem>}
        </RequiresPermission>
    );
});
