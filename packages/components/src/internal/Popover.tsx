import React, { FC } from 'react';

import { useOverlayPositioning } from './useOverlayPositioning';
import { TooltipProps } from './Tooltip';

interface PopoverProps extends TooltipProps {
    title?: string;
}

/**
 * Popover is an unusual component, because it needs to be rendered in relation to another element on the page. If you
 * are using this component you should probably be using it in conjunction with an OverlayTrigger which will inject the
 * targetRef for you.
 */
export const Popover: FC<PopoverProps> = ({ children, targetRef, id, placement, title }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef);
    const className = `lk-popover popover ${placement}`;

    return (
        <div id={id} className={className} style={style} ref={overlayRef}>
            <div className="arrow" />
            {title && <h3 className="popover-title">{title}</h3>}
            <div className="popover-content">{children}</div>
        </div>
    );
};
