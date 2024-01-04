import React, { FC } from 'react';

import { useOverlayPositioning } from './useOverlayPositioning';
import { TooltipProps } from './Tooltip';

interface PopoverProps extends TooltipProps {
    title?: string;
}

export const Popover: FC<PopoverProps> = ({ children, targetRef, id, placement, title }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef, -20);

    return (
        <div id={id} className={`lk-popover popover ${placement}`} style={style} ref={overlayRef}>
            <div className="arrow" />
            {title && <h3 className="popover-title">{title}</h3>}
            <div className="popover-content">{children}</div>
        </div>
    );
};
