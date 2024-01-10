import React, { FC } from 'react';

import { useOverlayPositioning } from './useOverlayPositioning';
import { TooltipProps } from './Tooltip';
import classNames from 'classnames';

interface PopoverProps extends TooltipProps {
    title?: string;
    className?: string;
}

/**
 * Popover is an unusual component, because it needs to be rendered in relation to another element on the page. If you
 * are using this component you should probably be using it in conjunction with an OverlayTrigger which will inject the
 * targetRef for you.
 */
export const Popover: FC<PopoverProps> = ({ children, className, targetRef, id, placement = 'right', title }) => {
    const { overlayRef, style } = useOverlayPositioning(placement, targetRef);
    const className_ = classNames('lk-popover', 'popover', placement, className);

    return (
        <div id={id} className={className_} style={style} ref={overlayRef}>
            <div className="arrow" />
            {title && <h3 className="popover-title">{title}</h3>}
            <div className="popover-content">{children}</div>
        </div>
    );
};
