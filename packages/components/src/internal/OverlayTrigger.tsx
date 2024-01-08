import React, {
    cloneElement,
    Children,
    FC,
    useRef,
    ReactElement,
    useState,
    useCallback,
    createElement,
    MutableRefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { usePortalRef } from './hooks';

export interface OverlayComponent {
    targetRef?: MutableRefObject<HTMLElement>;
}

interface Props {
    overlay: ReactElement<OverlayComponent>;
    elementType?: 'div' | 'span' | 'li'; // intentionally limiting the elements we'll render
    id: string;
    triggerType?: 'click' | 'hover';
}

/**
 * Wraps a ReactElement with an inline-block element that has the appropriate handlers to trigger the visibility of an
 * overlay. Can be triggered by hover or click. Your overlay component must have a prop called "targetRef", which this
 * component will inject. Your overlay component should probably be using the useOverlayPositioning hook in order to
 * position itself.
 */
export const OverlayTrigger: FC<Props> = ({ children, overlay, elementType = 'div', id, triggerType = 'hover' }) => {
    const portalElement = usePortalRef('inline-overlay-portal-' + id);
    const [show, setShow] = useState<boolean>(false);
    const targetRef = useRef(undefined);
    const clonedChild = cloneElement(Children.only(children) as ReactElement, { ref: targetRef });

    let overlayContent: ReactElement;

    if (show) {
        const clonedContent = cloneElement(overlay, { targetRef });
        overlayContent = createPortal(clonedContent, portalElement);
    }

    const onMouseEnter = useCallback(() => {
        if (triggerType !== 'hover') return;

        setShow(true);
    }, [triggerType]);
    const onMouseLeave = useCallback(() => {
        if (triggerType !== 'hover') return;
        setShow(false);
    }, [triggerType]);
    const onClick = useCallback(() => {
        if (triggerType !== 'click') return;
        setShow(_show => !_show);
    }, [triggerType]);

    const body = (
        <>
            {clonedChild}

            {overlayContent}
        </>
    );

    return createElement(elementType, { className: 'overlay-trigger', onMouseEnter, onMouseLeave, onClick }, body);
};
