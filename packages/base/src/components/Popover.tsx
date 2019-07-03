

import * as React from 'react'
import {OverlayTrigger, Popover, Tooltip} from 'react-bootstrap'

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
                    <Popover id="tooltip">
                        {caption}
                    </Popover>
                )}
                placement="top"
                ref={this.overlay}
                trigger={['focus', 'hover']}>
                {this.props.children}
            </OverlayTrigger>
        )
    }
}