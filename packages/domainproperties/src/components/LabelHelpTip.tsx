

import * as React from 'react'
import {OverlayTrigger, Popover} from 'react-bootstrap'
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface Props {
    title: string,
    body: any,
    placement?: "top"|"right"|"bottom"|"left"
}

const labelStyle = {
    height: '12px',
    marginBottom: '1px',
    cursor: 'default'
}

export const LabelHelpTip = (props: Props): any => {
    const { title, body, placement } = props;

    return (
        <OverlayTrigger
            overlay={(
                <Popover id="tooltip" title={title}>
                    {body}
                </Popover>
            )}
            placement={placement || "right"}
            ref={React.createRef()}>
            <FontAwesomeIcon style={labelStyle} icon={faQuestionCircle}/>
        </OverlayTrigger>
    )

};