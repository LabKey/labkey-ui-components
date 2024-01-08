import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from 'react';

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface OverlayPositioning {
    overlayRef: MutableRefObject<HTMLElement>;
    style: CSSProperties;
}

export const useOverlayPositioning = (placement: Placement, targetRef: MutableRefObject<HTMLElement>) => {
    const overlayRef = useRef(undefined);
    const [style, setStyle] = useState<CSSProperties>({});

    useEffect(() => {
        if (targetRef === undefined) return;
        const targetEl = targetRef.current;
        const overlayEl: HTMLElement = overlayRef.current;

        if (targetEl !== undefined && overlayEl !== undefined) {
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
};
