import React, { FC, MutableRefObject } from 'react';

import { Placement, useOverlayPositioning } from './useOverlayPositioning';

export interface TooltipProps {
    targetRef: MutableRefObject<HTMLElement>;
    id: string;
    placement: Placement;
}

export const Tooltip: FC<TooltipProps> = ({ children, targetRef, id, placement }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef);
    return (
        <div id={id} className={`lk-tooltip in tooltip ${placement}`} style={style} ref={overlayRef}>
            <div className="tooltip-arrow" />
            <div className="tooltip-inner">{children}</div>
        </div>
    );
};
