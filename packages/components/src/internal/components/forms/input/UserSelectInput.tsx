/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo } from 'react';

import { getUsersWithPermissions } from '../actions';

import { naturalSort } from '../../../../public/sort';

import { SelectInput, SelectInputOption, SelectInputProps } from './SelectInput';

function generateKey(permissions?: string | string[], containerPath?: string): string {
    let key = 'allPermissions';
    if (permissions) {
        if (Array.isArray(permissions)) {
            key = permissions.sort(naturalSort).join(';');
        } else {
            key = permissions;
        }
    }
    if (containerPath) {
        key = [containerPath, key].join('|');
    }
    return key;
}

interface UserSelectInputProps extends Omit<SelectInputProps, 'delimiter' | 'loadOptions'> {
    containerPath?: string;
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = memo(props => {
    const { clearCacheOnChange = false, containerPath, notifyList, permissions, useEmail, ...selectInputProps } = props;
    const key = useMemo(() => generateKey(permissions, containerPath), [containerPath, permissions]);

    const loadOptions = useCallback(
        async (input: string) => {
            let options: SelectInputOption[];
            const sanitizedInput = input?.trim().toLowerCase();

            try {
                const users = await getUsersWithPermissions(permissions, containerPath);
                options = users
                    .filter(v => {
                        if (sanitizedInput) {
                            return v.displayName?.toLowerCase().indexOf(sanitizedInput) > -1;
                        }

                        return true;
                    })
                    .map(v => ({
                        label: v.displayName,
                        value: notifyList ? v.displayName : useEmail ? v.email : v.userId,
                    }));
            } catch (error) {
                console.error(error);
            }

            return options;
        },
        [containerPath, notifyList, permissions, useEmail]
    );

    return (
        <SelectInput
            {...selectInputProps}
            clearCacheOnChange={clearCacheOnChange}
            delimiter={notifyList ? ';' : ','}
            key={key}
            loadOptions={loadOptions}
        />
    );
});

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
