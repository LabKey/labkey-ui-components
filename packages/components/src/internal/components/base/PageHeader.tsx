/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';

import { Notification } from '../notifications/Notification';

import { User } from './models/User';

interface PageHeaderProps {
    iconCls?: string;
    showNotifications?: boolean;
    title?: string;
    user?: User;
}

export class PageHeader extends React.Component<PageHeaderProps, any> {
    static defaultProps = {
        showNotifications: true,
    };

    render() {
        const { iconCls, showNotifications, title, user } = this.props;

        return (
            <div className="page-header">
                {this.props.children}
                <h2 className="text-capitalize no-margin-top">
                    {iconCls ? <span className={iconCls}>&nbsp;</span> : null}
                    {title}
                </h2>
                {showNotifications && <Notification user={user} />}
            </div>
        );
    }
}
