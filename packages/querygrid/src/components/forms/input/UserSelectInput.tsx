/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { List } from 'immutable'

import { SelectInput, SelectInputProps } from './SelectInput'
import { IUser } from "../model";
import { getProjectUsers } from "../actions";

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
        getProjectUsers().then((users: List<IUser>) => {
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
