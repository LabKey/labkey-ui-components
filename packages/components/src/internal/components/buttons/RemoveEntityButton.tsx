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

interface RemoveEntityButtonProps {
    entity?: string;
    index?: number;
    labelClass?: string;
    onClick: () => void;
}

export class RemoveEntityButton extends React.Component<RemoveEntityButtonProps, any> {
    static defaultProps = {
        labelClass: 'col-sm-3 control-label text-left',
    };

    render() {
        const { entity, index, labelClass, onClick } = this.props;

        return (
            <div className={labelClass}>
                <span className="container--action-button" onClick={onClick}>
                    <i className="fa fa-times container--removal-icon" />
                    {entity ? ' Remove ' + entity + ' ' + (index || '') : ''}
                </span>
            </div>
        );
    }
}
