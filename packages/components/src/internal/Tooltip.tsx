import React, { FC, MutableRefObject } from 'react';

import { Placement, useOverlayPositioning } from './useOverlayPositioning';

export interface TooltipProps {
    targetRef?: MutableRefObject<HTMLDivElement>;
    id: string;
    placement: Placement;
}

/**
 * Tooltip is an unusual component, because it needs to be rendered in relation to another element on the page. If you
 * are using this component you should probably be using it in conjunction with an OverlayTrigger which will inject the
 * targetRef for you.
 */
export const Tooltip: FC<TooltipProps> = ({ children, targetRef, id, placement }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef);
    return (
        <div id={id} className={`lk-tooltip in tooltip ${placement}`} style={style} ref={overlayRef}>
            <div className="tooltip-arrow" />
            <div className="tooltip-inner">{children}</div>
        </div>
    );
};
