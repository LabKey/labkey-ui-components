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

import classNames from 'classnames';

import { usePortalRef } from './hooks';

export interface OverlayComponent {
    targetRef?: MutableRefObject<HTMLElement>;
}

interface Props {
    className?: string;
    elementType?: 'div' | 'span' | 'li'; // intentionally limiting the elements we'll render
    id: string;
    overlay: ReactElement<OverlayComponent>;
    triggerType?: 'click' | 'hover';
}

/**
 * Wraps a ReactElement with an inline-block element that has the appropriate handlers to trigger the visibility of an
 * overlay. Can be triggered by hover or click. There are a few caveats to using this component:
 *  - Your overlay component must have a prop called "targetRef", which this component will inject
 *      - Your overlay component should probably be using the useOverlayPositioning hook in order to position itself
 *  - There should only be one child element to this component, we use React.Children.only to assert this
 *  - The child element to this must take a "ref" prop, and it must set that ref on the element you want to render the
 *  overlay in relation to
 *      - The easiest way to accomplish this is to make the child of this component a low level element such as div,
 *      span, button, etc.
 *      - If you need to make a proper component the direct child of this you can wrap your component with forwardRef:
 *      https://react.dev/reference/react/forwardRef
 */
export const OverlayTrigger: FC<Props> = ({
    children,
    className,
    elementType = 'div',
    id,
    overlay,
    triggerType = 'hover',
}) => {
    const portalElement = usePortalRef('inline-overlay-portal-' + id);
    const [show, setShow] = useState<boolean>(false);
    const targetRef = useRef(undefined);
    const clonedChild = cloneElement(Children.only(children) as ReactElement, { ref: targetRef });
    const className_ = classNames('overlay-trigger', className);

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

    return createElement(elementType, { className: className_, onMouseEnter, onMouseLeave, onClick }, body);
};
