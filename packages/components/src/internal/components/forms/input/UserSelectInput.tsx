/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';

import { getUsersWithPermissions } from '../actions';

import { SelectInput, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends Omit<SelectInputProps, 'delimiter' | 'loadOptions'> {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = props => {
    const { notifyList, permissions, useEmail, ...selectInputProps } = props;

    const loadOptions = useCallback(
        async (input: string) => {
            let options_;
            const input_ = input?.trim().toLowerCase();

            try {
                const users = await getUsersWithPermissions(permissions);
                options_ = users
                    .filter(v => {
                        if (input_) {
                            return v.displayName?.toLowerCase().indexOf(input_) > -1;
                        }

                        return true;
                    })
                    .map(v => ({
                        label: v.displayName,
                        value: notifyList ? v.displayName : useEmail ? v.email : v.userId,
                    }))
                    .toArray();
            } catch (error) {
                console.error(error);
            }

            return options_;
        },
        [notifyList, permissions, useEmail]
    );

    return <SelectInput {...selectInputProps} delimiter={notifyList ? ';' : ','} loadOptions={loadOptions} />;
};

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
