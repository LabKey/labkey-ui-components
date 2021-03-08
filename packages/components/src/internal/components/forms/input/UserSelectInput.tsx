/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';

import { getUsersWithPermissions } from '../actions';

import { SelectInput, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends SelectInputProps {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = props => {
    const { notifyList, permissions, useEmail, ...selectInputProps } = props;

    const loadOptions = useCallback(
        async (value: string, cb): Promise<void> => {
            let options = [];

            try {
                const users = await getUsersWithPermissions(permissions);
                options = users
                    .map(v => {
                        if (notifyList) {
                            return {
                                label: v.displayName,
                                value: v.displayName,
                            };
                        }

                        return {
                            label: v.displayName,
                            value: useEmail ? v.email : v.userId,
                        };
                    })
                    .toArray();
            } catch (error) {
                console.error(error);
            }

            cb(options);
        },
        [notifyList, permissions, useEmail]
    );

    return <SelectInput delimiter={notifyList ? ';' : ','} loadOptions={loadOptions} {...selectInputProps} />;
};

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
