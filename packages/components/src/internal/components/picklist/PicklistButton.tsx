import React, { FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { User } from '../base/models/User';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { RequiresPermission } from '../base/Permissions';

interface Props {
    model: QueryModel;
    user: User;
    metricFeatureArea?: string;
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user, metricFeatureArea } = props;

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.ManagePicklists}>
            <DropdownButton title="Picklists" id="samples-picklist-menu">
                <AddToPicklistMenuItem queryModel={model} user={user} metricFeatureArea={metricFeatureArea} />
                <PicklistCreationMenuItem
                    selectionKey={model?.id}
                    selectedQuantity={model?.selections?.size}
                    key="picklist"
                    user={user}
                    metricFeatureArea={metricFeatureArea}
                />
            </DropdownButton>
        </RequiresPermission>
    );
});
