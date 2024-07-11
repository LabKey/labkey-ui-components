import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from 'react';

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface OverlayPositioning<O extends Element = HTMLDivElement> {
    overlayRef: MutableRefObject<O>;
    style: CSSProperties;
}

export function useOverlayPositioning<T extends Element = HTMLDivElement, O extends Element = HTMLDivElement>(
    placement: Placement,
    targetRef: MutableRefObject<T>,
    isFixedPosition: boolean = false
): OverlayPositioning<O> {
    const overlayRef = useRef<O>(undefined);
    // Sometimes it takes a little extra time before the useEffect below can compute the style, so we default the
    // position to be (hopefully) very far off-screen, otherwise you see the overlay flash from one spot to another.
    const [style, setStyle] = useState<CSSProperties>({ top: -10000, left: -10000 });

    if (targetRef === undefined) {
        console.warn(
            'targetRef is undefined, did you forget to pass it to your overlay component (e.g. Tooltip/Popover)?'
        );
    }

    useEffect(() => {
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

        if (canComputeStyle) {
            const overlayRect = overlayEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const updatedStyle: CSSProperties = {
                top: targetRect.top + window.scrollY,
            };

            // X positioning
            if (placement === 'top' || placement === 'bottom') {
                let left = targetRect.left + targetRect.width / 2 - overlayRect.width / 2;
                if (!isFixedPosition) left = left + window.scrollX;
                updatedStyle.left = left;
            } else if (placement === 'right') {
                let left = targetRect.left + targetRect.width;
                if (!isFixedPosition) left = left + window.scrollX;
                updatedStyle.left = left;
            } else if (placement === 'left') {
                updatedStyle.left = targetRect.left - overlayRect.width;
            }
            // make sure the overlay is within the viewport (Issue 49792)
            if (typeof updatedStyle.left === 'number' && updatedStyle.left < 0) {
                updatedStyle.left = 0;
            }

            // Y positioning
            if (placement === 'left' || placement === 'right') {
                let top = targetRect.top + targetRect.height / 2 - overlayRect.height / 2;
                if (!isFixedPosition) top = top + window.scrollY;
                updatedStyle.top = top;
            } else if (placement === 'top') {
                let top = targetRect.top - overlayRect.height;
                if (!isFixedPosition) top = top + window.scrollY;
                updatedStyle.top = top;
            } else if (placement === 'bottom') {
                let top = targetRect.top + targetRect.height;
                if (!isFixedPosition) top = top + window.scrollY;
                updatedStyle.top = top;
            }

            setStyle(updatedStyle);
        }
    }, [targetRef, placement]);

    return { overlayRef, style };
}
