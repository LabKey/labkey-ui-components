/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useEffect, useMemo, useState } from 'react';

import { getUsersWithPermissions } from '../actions';

import { initOptions, SelectInputOption, SelectInput, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends SelectInputProps {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = props => {
    const { notifyList, permissions, useEmail, value, ...selectInputProps } = props;
    const [isLoading, setIsLoading] = useState(true);
    const [options, setOptions] = useState<SelectInputOption[]>();

    useEffect(() => {
        setIsLoading(true);
        (async () => {
            try {
                const users = await getUsersWithPermissions(permissions);
                const options_ = users
                    .map(v => ({
                        label: v.displayName,
                        value: notifyList ? v.displayName : useEmail ? v.email : v.userId,
                    }))
                    .toArray();
                setOptions(options_);
            } catch (error) {
                console.error(error);
            }
            setIsLoading(false);
        })();
    }, [notifyList, permissions, useEmail]);

    const selectedOptions = useMemo(() => {
        if (isLoading) return undefined;
        return initOptions({ ...selectInputProps, options, value });
    }, [isLoading, selectInputProps, options, value]);

    return (
        <SelectInput
            {...selectInputProps}
            delimiter={notifyList ? ';' : ','}
            autoValue={false}
            isLoading={isLoading}
            options={options}
            selectedOptions={selectedOptions}
        />
    );
};

UserSelectInput.defaultProps = {
    notifyList: false,
    useEmail: false,
};

UserSelectInput.displayName = 'UserSelectInput';
