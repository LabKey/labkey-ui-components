import React, { FC, memo, MouseEvent, useCallback, useMemo } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { generateId } from '../..';

interface Props {
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpIcon: FC<Props> = memo(({ children, placement = 'bottom' }) => {
    const id = useMemo(() => generateId(), []);
    const overlayContent = <Popover id={id}>{children}</Popover>;
    const onClick = useCallback((event: MouseEvent<HTMLSpanElement>) => {
        // We need to preventDefault and stopPropagation here so we can use HelpIcon inside of <label> elements. If we
        // cancel the event the popover will not render.
        event.preventDefault();
        event.stopPropagation();
    }, []);
    return (
        <span className="help-icon" onClick={onClick}>
            <OverlayTrigger overlay={overlayContent} placement={placement} rootClose trigger="click">
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        </span>
    );
});
