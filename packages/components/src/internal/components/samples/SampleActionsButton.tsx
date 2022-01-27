/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, ReactNode, useMemo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { hasAnyPermissions, User } from '../base/models/User';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { PicklistCreationMenuItem } from '../picklist/PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from '../picklist/AddToPicklistMenuItem';

interface Props {
    disabled?: boolean;
    user: User;
    model: QueryModel;
    moreMenuItems: ReactNode;
}

export const SampleActionsButton: FC<Props> = memo(props => {
    const { disabled, user, model, moreMenuItems } = props;

    const sampleFieldKey = useMemo(() => {
        return model?.allColumns?.find(c => c.isSampleLookup())?.fieldKey;
    }, [model]);

    const title: ReactNode = 'Samples';
    const bsStyle = 'default';

    const id = 'assay-samples-menu';

    return (
        <DropdownButton disabled={disabled} id={`${id}-btn`} bsStyle={bsStyle} title={title}>
            {hasAnyPermissions(user, [PermissionTypes.Insert, PermissionTypes.Update]) && (
                <>
                    {moreMenuItems && moreMenuItems}
                    <hr className="divider" />
                    <PicklistCreationMenuItem
                        key={`${id}-create-picklist`}
                        itemText="Create Picklist"
                        user={user}
                        selectionKey={model.id}
                        queryModel={model}
                        sampleFieldKey={sampleFieldKey}
                    />
                    <AddToPicklistMenuItem user={user} queryModel={model} sampleFieldKey={sampleFieldKey} />
                </>
            )}
        </DropdownButton>
    );
});
