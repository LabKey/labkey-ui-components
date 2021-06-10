import React, { CSSProperties, FC, memo, ReactNode, useCallback, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
    customStyle?: CSSProperties; // additional style added to help icon
    iconComponent?: ReactNode; // use a different icon than the question mark circle
    id?: string;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    required?: boolean; // will add required message at bottom of help tooltip
    size?: any; // size of help icon, if using default icon
    title?: string;
    bsStyle?: string; // is placed on the popover container as "popover-<value>"
}

export const LabelHelpTip: FC<Props> = memo(props => {
    const { children, title, placement, id, size, customStyle, required, iconComponent, bsStyle } = props;
    const targetRef = useRef();
    const [show, setShow] = useState(false);

    const toggleShow = useCallback(() => {
        setShow(!show);
    }, [show]);

    // Need to have both icon and overlay inside mouse handlers div so overlay stays visible when moused over
    return (
        <span className="label-help-target" onMouseOver={toggleShow} onMouseOut={toggleShow} ref={targetRef}>
            {iconComponent ?? (
                <FontAwesomeIcon size={size} style={customStyle} className="label-help-icon" icon={faQuestionCircle} />
            )}
            <Overlay target={targetRef.current} show={show} placement={placement}>
                <Popover id={id} title={title} bsStyle={bsStyle} >
                    {children}
                    {required && <div className="label-help-required">This field is required.</div>}
                </Popover>
            </Overlay>
        </span>
    );
});

LabelHelpTip.displayName = 'LabelHelpTip';

LabelHelpTip.defaultProps = {
    customStyle: {},
    id: 'tooltip',
    size: '1x',
};
