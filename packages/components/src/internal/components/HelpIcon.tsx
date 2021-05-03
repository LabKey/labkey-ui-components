import React, { FC, memo, useMemo } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { generateId } from '../..';

interface Props {
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpIcon: FC<Props> = memo(({ children, placement = 'bottom' }) => {
    const id = useMemo(() => generateId(), []);
    const overlayContent = <Popover id={id}>{children}</Popover>;
    return (
        <span className="help-icon">
            <OverlayTrigger overlay={overlayContent} placement={placement}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        </span>
    );
});
