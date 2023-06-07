import React, { FC, memo, ReactNode, useCallback, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';

interface Props {
    bsStyle?: string; // is placed on the popover container as "popover-<value>"
    iconComponent?: ReactNode; // use a different icon than the question mark circle
    id?: string;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    popoverClassName?: string; // is placed on the popover container
    required?: boolean; // will add required message at bottom of help tooltip
    title?: string;
}

export const LabelHelpTip: FC<Props> = memo(props => {
    const { children, title, placement, id, required, iconComponent, bsStyle, popoverClassName } = props;
    const targetRef = useRef();
    const [show, setShow] = useState(false);

    const toggleShow = useCallback(() => {
        setShow(_show => !_show);
    }, []);

    // Need to have both icon and overlay inside mouse handlers div so overlay stays visible when moused over
    return (
        <span className="label-help-target" onMouseOver={toggleShow} onMouseOut={toggleShow} ref={targetRef}>
            {iconComponent ?? <span className="label-help-icon fa fa-question-circle" />}
            <Overlay target={targetRef.current} show={show} placement={placement}>
                <Popover id={id} title={title} bsStyle={bsStyle} className={popoverClassName}>
                    {children}
                    {required && <div className="label-help-required">This field is required.</div>}
                </Popover>
            </Overlay>
        </span>
    );
});

LabelHelpTip.displayName = 'LabelHelpTip';

LabelHelpTip.defaultProps = {
    id: 'tooltip',
};
