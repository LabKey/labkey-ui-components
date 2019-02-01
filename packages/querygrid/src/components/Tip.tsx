/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
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