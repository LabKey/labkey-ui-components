/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';

import { getUsersWithPermissions } from '../actions';

import { Option, SelectInput, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends SelectInputProps {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = props => {
    const { notifyList, permissions, useEmail, ...selectInputProps } = props;

    const loadOptions = useCallback((): Promise<Option[]> => {
        return new Promise(async resolve => {
            let options: Option[] = [];

            try {
                const users = await getUsersWithPermissions(permissions);
                options = users
                    .map(v => ({
                        label: v.displayName,
                        value: notifyList ? v.displayName : useEmail ? v.email : v.userId,
                    }))
                    .toArray();
            } catch (error) {
                console.error(error);
            }

            resolve(options);
        });
    }, [notifyList, permissions, useEmail]);

    return <SelectInput delimiter={notifyList ? ';' : ','} loadOptions={loadOptions} {...selectInputProps} />;
};

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
