import React, { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';

import { useOverlayPositioning } from './useOverlayPositioning';
import { TooltipProps } from './Tooltip';

interface PopoverProps extends TooltipProps, PropsWithChildren {
    className?: string;
    isFlexPlacement?: boolean;
    title?: string;
}

/**
 * Popover is an unusual component, because it needs to be rendered in relation to another element on the page. If you
 * are using this component you should probably be using it in conjunction with an OverlayTrigger which will inject the
 * targetRef for you.
 *
 * See additional docs at components/docs/overlays.md
 */
export const Popover: FC<PopoverProps> = props => {
    const { children, className, targetRef, id, isFixedPosition, isFlexPlacement, title } = props;
    const { overlayRef, style, placement } = useOverlayPositioning(
        props.placement ?? 'right',
        targetRef,
        isFixedPosition,
        isFlexPlacement
    );
    const className_ = classNames('lk-popover', 'popover', placement, className, {
        'lk-popover--is-fixed': isFixedPosition,
    });

    return (
        <div id={id} className={className_} style={style} ref={overlayRef}>
            <div className="arrow" />
            {title && <h3 className="popover-title">{title}</h3>}
            <div className="popover-content">{children}</div>
        </div>
    );
};
Popover.displayName = 'Popover';
