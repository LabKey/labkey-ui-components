/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';

import { getUsersWithPermissions } from '../actions';

import { SelectInput, SelectInputProps } from './SelectInput';

interface UserSelectInputProps extends SelectInputProps {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export class UserSelectInput extends Component<UserSelectInputProps> {
    static defaultProps = {
        cache: false,
        notifyList: false,
        useEmail: false,
    };

    loadOptions = (value, cb): void => {
        const { useEmail } = this.props;
        getUsersWithPermissions(this.props.permissions)
            .then(users => {
                cb(null, {
                    complete: true,
                    options: users
                        .map(v => {
                            if (this.props.notifyList) {
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
                        .toArray(),
                });
            })
            .catch(error => {
                console.error(error);
                cb(null, { complete: true, options: [] });
            });
    };

    render(): ReactNode {
        const inputProps = Object.assign(
            {
                loadOptions: this.loadOptions,
                delimiter: this.props.notifyList ? ';' : ',',
            },
            UserSelectInput.defaultProps,
            this.props
        );

        return <SelectInput {...inputProps} />;
    }
}
