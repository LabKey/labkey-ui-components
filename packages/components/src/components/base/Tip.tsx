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
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface Props {
    caption: React.ReactNode;
    trigger?: string[];
}

export class Tip extends React.Component<Props, any> {
    static defaultProps = {
        trigger: ['focus', 'hover'],
    };

    render() {
        const { caption, trigger } = this.props;

        return (
            <OverlayTrigger
                delay={200}
                overlay={<Tooltip id="tooltip">{caption}</Tooltip>}
                placement="top"
                trigger={trigger}
            >
                {this.props.children}
            </OverlayTrigger>
        );
    }
}
