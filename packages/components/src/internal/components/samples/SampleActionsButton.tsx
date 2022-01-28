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
import { SAMPLE_TYPE_CONCEPT_URI } from '../domainproperties/constants';

interface Props {
    disabled?: boolean;
    user: User;
    model: QueryModel;
    moreMenuItems: ReactNode;
}

export const SampleActionsButton: FC<Props> = memo(props => {
    const { disabled, user, model, moreMenuItems } = props;

    const sampleFieldKey = useMemo(() => model?.allColumns?.find(c =>
        SAMPLE_TYPE_CONCEPT_URI.localeCompare(c.conceptURI, 'en', { sensitivity: 'base' }) === 0
    )?.fieldKey,[model]);

    const id = 'sample-actions-menu';

    return (
        <DropdownButton disabled={disabled} id={`${id}-btn`} bsStyle={'default'} title={'Samples'}>
            {hasAnyPermissions(user, [PermissionTypes.Insert, PermissionTypes.Update]) && (
                <>
                    {moreMenuItems}
                    {!!moreMenuItems && <hr className="divider" />}
                    <PicklistCreationMenuItem
                        key={`${id}-create-picklist`}
                        itemText="Create Picklist"
                        user={user}
                        selectionKey={sampleFieldKey ? undefined : model.id}
                        queryModel={model}
                        sampleFieldKey={sampleFieldKey}
                    />
                    <AddToPicklistMenuItem user={user} queryModel={model} sampleFieldKey={sampleFieldKey} />
                </>
            )}
        </DropdownButton>
    );
});
