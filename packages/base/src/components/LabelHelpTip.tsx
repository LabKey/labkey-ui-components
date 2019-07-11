

import * as React from 'react'
import {Overlay, Popover} from 'react-bootstrap'
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface LabelHelpTipProps {
    title: string,
    body: () => any,
    placement?: "top"|"right"|"bottom"|"left"
}

interface LabelHelpTipState {
    show: boolean,
    attachRef: (any) => void,
    target: any
}

const iconStyle = {
    height: '12px',
    margin: '0px 2px 1px',
    cursor: 'default'
};

const targetStyle = {
    width: '14px'
}

export class LabelHelpTip extends React.PureComponent<LabelHelpTipProps, LabelHelpTipState> {
    constructor(props) {
        super(props);

        this.state = {
            show: false,
            attachRef: target => this.setState({ target }),
            target: null
        };
    }

    render() {
        const { title, body, placement } = this.props;
        const { target, show, attachRef } = this.state;

        return (
            <>
                <span style={targetStyle} ref={attachRef}
                     onMouseOver={() => this.setState({ show: !show })}
                     onMouseOut={() => this.setState({ show: !show })}>

                    {/* Need to have both icon and overlay inside mouse handlers div so overlay stays visible when moused over*/}
                    <FontAwesomeIcon style={iconStyle} icon={faQuestionCircle}/>
                    <Overlay target={target} show={show} placement={placement}>
                        <Popover id="tooltip" title={title}>
                            {body()}
                        </Popover>
                    </Overlay>
                </span>


            </>

        )
    }
};