import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from 'react';

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export const useOverlayPositioning = (
    placement: Placement,
    targetRef: MutableRefObject<HTMLElement>,
    offset: number = 0
) => {
    const overlayRef = useRef(undefined);
    const [style, setStyle] = useState<CSSProperties>({});

    useEffect(() => {
        const targetEl = targetRef.current;
        const overlayEl: HTMLElement = overlayRef.current;

        if (targetEl !== undefined && overlayEl !== undefined) {
            const overlayRect = overlayEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const updatedStyle: CSSProperties = {};

            // X positioning
            if (placement === 'top' || placement === 'bottom') {
                updatedStyle.left = targetRect.left - overlayRect.width / 2;
            } else if (placement === 'right') {
                updatedStyle.left = targetRect.left + overlayRect.width + offset;
            } else if (placement === 'left') {
                updatedStyle.left = targetRect.left - targetRect.width + offset;
            }

            // Y positioning
            if (placement === 'left' || placement === 'right') {
                updatedStyle.top = targetRect.height / 2 - overlayRect.height / 2;
            } else if (placement === 'top') {
                updatedStyle.top = 0 - overlayRect.height;
                // updatedStyle.top = targetRect.top;
            } else if (placement === 'bottom') {
                updatedStyle.top = targetRect.height;
            }

            setStyle(updatedStyle);
        }
    }, [targetRef, placement, offset]);

    return { overlayRef, style };
};
