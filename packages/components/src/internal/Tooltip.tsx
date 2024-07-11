import React, { FC, MutableRefObject } from 'react';
import classNames from 'classnames';

import { Placement, useOverlayPositioning } from './useOverlayPositioning';

export interface TooltipProps {
    id: string;
    // Sometimes Popovers/Tooltips use fixed positioning, which requires different considerations when positioning the
    // elements on the page
    isFixedPosition?: boolean;
    placement: Placement;
    targetRef?: MutableRefObject<HTMLElement>;
}

/**
 * Tooltip is an unusual component, because it needs to be rendered in relation to another element on the page. If you
 * are using this component you should probably be using it in conjunction with an OverlayTrigger which will inject the
 * targetRef for you.
 *
 * See additional docs at components/docs/overlays.md
 */
export const Tooltip: FC<TooltipProps> = ({ children, targetRef, id, isFixedPosition, placement }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef, isFixedPosition);
    const className = classNames('lk-tooltip', 'in', 'tooltip', placement, {
        'lk-tooltip--is-fixed': isFixedPosition,
    });
    return (
        <div id={id} className={className} style={style} ref={overlayRef}>
            <div className="tooltip-arrow" />
            <div className="tooltip-inner">{children}</div>
        </div>
    );
};
Tooltip.displayName = 'Tooltip';
