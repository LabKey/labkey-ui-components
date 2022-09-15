/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo } from 'react';
import { List } from 'immutable';

import { SelectInput } from '../forms/input/SelectInput';

import { createGroupedOptions } from '../administration/utils';

import { Principal, SecurityRole } from './models';

interface Props {
    onSelect: (selected: Principal) => void;
    placeholder?: string;
    principals: List<Principal>;
    role: SecurityRole;
}

export const AddRoleAssignmentInput: FC<Props> = memo(props => {
    const { role, principals, onSelect, placeholder = 'Add member or group...' } = props;

    const onChange = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            if (selected) {
                onSelect(selected);
            }
        },
        [onSelect]
    );

    const name = useMemo(() => {
        return 'addRoleAssignment';
    }, []);

    const options = useMemo(() => {
        return createGroupedOptions(principals);
    }, [principals]);

    return (
        <SelectInput
            autoValue={false}
            name={name}
            key={name + ':' + role.uniqueName}
            options={options}
            placeholder={placeholder}
            inputClass="col-xs-12"
            valueKey="userId"
            labelKey="displayName"
            onChange={onChange}
            selectedOptions={null}
        />
    );
});
