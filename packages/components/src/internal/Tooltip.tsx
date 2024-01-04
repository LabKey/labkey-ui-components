import React, { FC, MutableRefObject } from 'react';

import { Placement, useOverlayPositioning } from './useOverlayPositioning';

export interface TooltipProps {
    targetRef: MutableRefObject<HTMLElement>;
    id: string;
    placement: Placement;
}

/**
 * Tooltip is an unusual component, because it needs to be rendered in relation to another element on the page. In order
 * to use this component you'll need to do something like this:
 *
 * const MyComponent = () => {
 *     const buttonRef = useRef(undefined);
 *
 *      // Note: my-component here needs to have position: relative
 *     return (
 *          <div className="my-component">
 *              <button className="btn btn-default" type="button" ref={buttonRef}>
 *                  Button With Tooltip
 *              </button>
 *
 *              <Tooltip targetRef={buttonRef} id="tooltip-top" placement="top">
 *                  I am a tooltip on top of a button
 *              </Tooltip>
 *          </div>
 *     );
 * }
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
