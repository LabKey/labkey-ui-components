/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';

import { SelectInput } from '../../..';

import { Principal, SecurityRole } from './models';

interface Props {
    role: SecurityRole;
    principals: List<Principal>;
    onSelect: (selected: Principal) => any;
    placeholder?: string;
}

export class AddRoleAssignmentInput extends React.PureComponent<Props, any> {
    static defaultProps = {
        placeholder: 'Add member or group...',
    };

    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected);

            // setting the react-select value back to null will clear it but leave it as focused
            ref.setValue(null);
        }
    };

    render() {
        const { role, principals, placeholder } = this.props;
        const name = 'addRoleAssignment';

        return (
            <SelectInput
                name={name}
                key={name + ':' + role.uniqueName}
                options={principals.toArray()}
                placeholder={placeholder}
                inputClass="col-xs-12"
                valueKey="userId"
                labelKey="displayName"
                onChange={this.onChange}
                formsy={false}
                showLabel={false}
                multiple={false}
                required={false}
            />
        );
    }
}
