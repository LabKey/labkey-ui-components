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
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

interface Props {
    caption: React.ReactNode
}

export class Tip extends React.Component<Props, any> {

    overlay: React.RefObject<OverlayTrigger>;

    constructor(props: Props) {
        super(props);

        this.onClick = this.onClick.bind(this);

        this.overlay = React.createRef();
    }

    onClick() {
        if (this.overlay.current) {
            this.overlay.current.handleDelayedHide();
        }
    }

    render() {
        const { caption } = this.props;

        return (
            <OverlayTrigger
                delay={200}
                onClick={this.onClick}
                overlay={(
                    <Tooltip id="tooltip">
                        {caption}
                    </Tooltip>
                )}
                placement="top"
                ref={this.overlay}
                trigger={['focus', 'hover']}>
                {this.props.children}
            </OverlayTrigger>
        )
    }
}
