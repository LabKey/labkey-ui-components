/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';

import { getUsersWithPermissions } from '../actions';

import { SelectInput, SelectInputOption, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends Omit<SelectInputProps, 'delimiter' | 'loadOptions'> {
    containerPath?: string;
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = props => {
    const { clearCacheOnChange = false, containerPath, notifyList, permissions, useEmail, ...selectInputProps } = props;

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
            loadOptions={loadOptions}
        />
    );
};

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
