import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from 'react';

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface OverlayPositioning<O extends Element = HTMLDivElement> {
    overlayRef: MutableRefObject<O>;
    style: CSSProperties;
}

export function useOverlayPositioning<T extends Element = HTMLDivElement, O extends Element = HTMLDivElement>(
    placement: Placement,
    targetRef: MutableRefObject<T>
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
                // updatedStyle.left = targetRect.left - overlayRect.width / 2;
                updatedStyle.left = targetRect.left + window.scrollX + targetRect.width / 2 - overlayRect.width / 2;
            } else if (placement === 'right') {
                updatedStyle.left = targetRect.left + window.scrollX + targetRect.width;
            } else if (placement === 'left') {
                updatedStyle.left = targetRect.left - overlayRect.width;
            }

            // Y positioning
            if (placement === 'left' || placement === 'right') {
                updatedStyle.top = targetRect.top + window.scrollY + targetRect.height / 2 - overlayRect.height / 2;
            } else if (placement === 'top') {
                updatedStyle.top = targetRect.top + window.scrollY - overlayRect.height;
            } else if (placement === 'bottom') {
                updatedStyle.top = targetRect.top + window.scrollY + targetRect.height;
            }

            setStyle(updatedStyle);
        }
    }, [targetRef, placement]);

    return { overlayRef, style };
}
