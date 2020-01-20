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
import { Map } from 'immutable';

import { Breadcrumb } from './Breadcrumb';
import { CreatedModified } from '../base/CreatedModified';

interface Props {
    row?: Map<string, any>
    userServerDate?: boolean
}

export class BreadcrumbCreate extends React.Component<Props, any> {

    static defaultProps = {
        userServerDate: true
    };

    render() {
        const { children, row, userServerDate } = this.props;

        return (
            <div className="row component-crumbcreate--container">
                <Breadcrumb className="col-xs-8 col-sm-8 col-md-8">
                    {children}
                </Breadcrumb>
                <CreatedModified row={row} userServerDate={userServerDate} className="col-xs-4 col-sm-4 col-md-4"/>
            </div>
        )
    }
}
