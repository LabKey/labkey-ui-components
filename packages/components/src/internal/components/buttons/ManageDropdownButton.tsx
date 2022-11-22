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
    className?: string;
    collapsed: boolean;
    disabled: boolean;
    id: string;
    pullRight: boolean;
    title?: string;
}

export class ManageDropdownButton extends React.Component<Props, any> {
    static defaultProps = {
        disabled: false,
        pullRight: false,
        collapsed: false,
        title: 'Manage',
    };

    render() {
        const { id, pullRight, collapsed, disabled, title, className } = this.props;
        let buttonLabel: any = title;
        let noCaret = false;

        if (collapsed) {
            buttonLabel = (
                <span>
                    <i className="fa fa-bars" /> Manage
                </span>
            );
            noCaret = true;
        }

        return (
            <DropdownButton
                disabled={disabled}
                id={`${id}-managebtn`}
                title={buttonLabel}
                noCaret={noCaret}
                pullRight={pullRight}
                className={className}
            >
                {this.props.children}
            </DropdownButton>
        );
    }
}
