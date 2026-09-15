/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { CSSProperties, MutableRefObject, useLayoutEffect, useRef, useState } from 'react';

export type Placement = 'bottom' | 'left' | 'right' | 'top';

export interface OverlayPositioning<O extends Element = HTMLDivElement> {
    overlayRef: MutableRefObject<O>;
    placement?: Placement;
    style: CSSProperties;
}

export function useOverlayPositioning<T extends Element = HTMLDivElement, O extends Element = HTMLDivElement>(
    placement: Placement,
    targetRef: MutableRefObject<T>,
    isFixedPosition = false,
    isFlexPlacement = false
): OverlayPositioning<O> {
    const overlayRef = useRef<O>(undefined);
    // The effect below bails without setting a style when the refs aren't measurable, so default to off-screen.
    const [style, setStyle] = useState<CSSProperties>({ top: -10000, left: -10000 });
    const [updatedPlacement, setUpdatedPlacement] = useState<Placement>(placement);

    if (targetRef === undefined) {
        console.warn(
            'targetRef is undefined, did you forget to pass it to your overlay component (e.g. Tooltip/Popover)?'
        );
    }

    useLayoutEffect(() => {
        if (targetRef === undefined) return;
        const targetEl = targetRef.current;
        const overlayEl = overlayRef.current;

        // We have to be a little paranoid because if our refs aren't configured exactly right, or if things render in
        // an odd manner this code can cause a whole page to fall over.
        const canComputeStyle =
            targetEl !== undefined &&
            targetEl.getBoundingClientRect !== undefined &&
            overlayEl !== undefined &&
            overlayEl.getBoundingClientRect !== undefined;
        if (!canComputeStyle) return;

        const overlayRect = overlayEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        let { left, top } = targetRect;

        let updatedPlacement = placement;
        if (isFlexPlacement) {
            if (placement === 'left' || placement === 'right') {
                if (window.innerWidth - targetRect.right > targetRect.left) updatedPlacement = 'right';
                else updatedPlacement = 'left';
            } else if (placement === 'top' || placement === 'bottom') {
                if (window.innerHeight - targetRect.bottom > targetRect.top) updatedPlacement = 'bottom';
                else updatedPlacement = 'top';
            }
        }

        // X positioning
        if (updatedPlacement === 'top' || updatedPlacement === 'bottom') {
            left += targetRect.width / 2 - overlayRect.width / 2;
        } else if (updatedPlacement === 'right') {
            left += targetRect.width;
        } else if (updatedPlacement === 'left') {
            left -= overlayRect.width;
        }

        // make sure the overlay is within the viewport (Issue 49792)
        if (left < 0) {
            left = 0;
        }

        if (!isFixedPosition) {
            left += window.scrollX;
        }

        // Y positioning
        if (updatedPlacement === 'left' || updatedPlacement === 'right') {
            top += targetRect.height / 2 - overlayRect.height / 2;
        } else if (updatedPlacement === 'top') {
            top -= overlayRect.height;
        } else if (updatedPlacement === 'bottom') {
            top += targetRect.height;
        }

        if (!isFixedPosition) {
            top += window.scrollY;
        }

        setStyle({ left, top });
        setUpdatedPlacement(updatedPlacement);
    }, [isFlexPlacement, isFixedPosition, placement, targetRef]);

    return { overlayRef, style, placement: updatedPlacement };
}
