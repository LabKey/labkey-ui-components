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
import { DropdownButton } from 'react-bootstrap';

interface Props {
    disabled: boolean;
    id: string;
    pullRight: boolean;
    collapsed: boolean;
}

export class ManageDropdownButton extends React.Component<Props, any> {
    static defaultProps = {
        disabled: false,
        pullRight: false,
        collapsed: false,
    };

    render() {
        const { id, pullRight, collapsed, disabled } = this.props;
        let title: any = 'Manage';
        let bsStyle = 'primary';
        let noCaret = false;

        if (collapsed) {
            bsStyle = undefined;
            title = (
                <span>
                    <i className="fa fa-bars" />
                </span>
            );
            noCaret = true;
        }

        return (
            <DropdownButton
                disabled={disabled}
                id={`${id}-managebtn`}
                bsStyle={bsStyle}
                title={title}
                noCaret={noCaret}
                pullRight={pullRight}
            >
                {this.props.children}
            </DropdownButton>
        );
    }
}
