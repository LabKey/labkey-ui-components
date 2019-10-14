/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List } from 'immutable'
import { Security } from '@labkey/api'

import { SelectInput, SelectInputProps } from './SelectInput'

export interface IUser {
    displayName: string
    email: string
    userId: number
}

// TODO put the users list in global state (reactn) and move getUsers into actions
let _p: Promise<any>;

export function getUsers(): Promise<List<IUser>> {
    if (!_p) {
        _p = new Promise((resolve, reject) => {
            Security.getUsers({
                active: true,  // Issue 30765: don't get deactivated users
                success: function(data) {
                    let users = List<IUser>(data.users);

                    // sort by displayName
                    resolve(users.sort((a, b) => {
                        const _a = a.displayName.toLowerCase();
                        const _b = b.displayName.toLowerCase();

                        if (_a === _b) {
                            return 0;
                        }
                        return _a > _b ? 1 : -1;
                    }));
                },
                failure: function() {
                    // This API responds with HTML, lol
                    reject('LABKEY.Security.getUsers() failed. Check request log.');
                }
            })
        });
    }

    return _p;
}

interface UserSelectInputProps extends SelectInputProps {
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean
}

export class UserSelectInput extends React.Component<UserSelectInputProps, any> {

    static defaultProps = {
        cache: false,
        notifyList: false
    };

    loadOptions(value, cb) {
        getUsers().then((users: List<IUser>) => {
            cb(null, {
                complete: true,
                options: users.map((v) => {
                    if (this.props.notifyList) {
                        return {
                            label: v.displayName,
                            value: v.displayName
                        }
                    }

                    return {
                        label: v.displayName,
                        value: v.userId
                    }
                }).toArray()
            });
        }).catch((error) => {
            console.error(error);
        });
    }

    render() {
        const inputProps = Object.assign({
            loadOptions: this.loadOptions.bind(this),
            delimiter: this.props.notifyList ? ';' : ',',
        }, UserSelectInput.defaultProps, this.props);

        return <SelectInput {...inputProps} />
    }
}
