import React, { FC, memo, useMemo } from 'react';

import { generateId } from '../util/utils';
import { Placement } from '../useOverlayPositioning';
import { Popover } from '../Popover';
import { OverlayTrigger } from '../OverlayTrigger';

interface Props {
    placement?: Placement;
}

export const HelpIcon: FC<Props> = memo(({ children, placement = 'bottom' }) => {
    const id = useMemo(() => generateId(), []);
    const overlayContent = (
        <Popover id={id} placement={placement}>
            {children}
        </Popover>
    );
    return (
        <span className="help-icon">
            <OverlayTrigger overlay={overlayContent}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        </span>
    );
});
