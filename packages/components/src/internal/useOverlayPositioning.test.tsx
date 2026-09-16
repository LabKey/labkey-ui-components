/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useRef } from 'react';
import { render, screen } from '@testing-library/react';

import { Placement, useOverlayPositioning } from './useOverlayPositioning';

interface Box {
    height: number;
    left: number;
    top: number;
    width: number;
}

const TARGET_BOX: Box = { height: 20, left: 200, top: 100, width: 50 };
const OVERLAY_BOX: Box = { height: 40, left: 0, top: 0, width: 80 };

// The target box each render measures against. Mutated by tests that need the target somewhere else on the page.
let targetBox: Box;

function toRect(box: Box): DOMRect {
    const rect = {
        bottom: box.top + box.height,
        height: box.height,
        left: box.left,
        right: box.left + box.width,
        top: box.top,
        width: box.width,
        x: box.left,
        y: box.top,
    };
    return { ...rect, toJSON: () => rect } as DOMRect;
}

function setWindowMetrics(
    metrics: Partial<Record<'innerHeight' | 'innerWidth' | 'scrollX' | 'scrollY', number>>
): void {
    Object.entries(metrics).forEach(([key, value]) => {
        Object.defineProperty(window, key, { configurable: true, value, writable: true });
    });
}

interface HarnessProps {
    // When false the target ref is never attached to an element, leaving targetRef.current undefined
    attachTarget?: boolean;
    isFixedPosition?: boolean;
    isFlexPlacement?: boolean;
    placement: Placement;
}

const Harness: FC<HarnessProps> = ({ attachTarget = true, isFixedPosition, isFlexPlacement, placement }) => {
    const targetRef = useRef<HTMLDivElement>(undefined);
    const {
        overlayRef,
        style,
        placement: updatedPlacement,
    } = useOverlayPositioning<HTMLDivElement, HTMLDivElement>(placement, targetRef, isFixedPosition, isFlexPlacement);

    return (
        <>
            <div data-testid="target" ref={attachTarget ? targetRef : undefined} />
            <div data-placement={updatedPlacement} data-testid="overlay" ref={overlayRef} style={style} />
        </>
    );
};

interface OverlayPosition {
    left: string;
    placement: string;
    top: string;
}

function overlayPosition(): OverlayPosition {
    const overlay = screen.getByTestId('overlay');
    return { left: overlay.style.left, placement: overlay.dataset.placement, top: overlay.style.top };
}

describe('useOverlayPositioning', () => {
    beforeAll(() => {
        jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
            this: HTMLElement
        ): DOMRect {
            return toRect(this.dataset.testid === 'overlay' ? OVERLAY_BOX : targetBox);
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        targetBox = { ...TARGET_BOX };
        setWindowMetrics({ innerHeight: 800, innerWidth: 1024, scrollX: 0, scrollY: 0 });
    });

    // Target occupies 200..250 x 100..120, overlay is 80x40, so a centered overlay sits at left 185 and a
    // vertically centered one at top 90.
    test.each([
        ['bottom' as Placement, '185px', '120px'],
        ['left' as Placement, '120px', '90px'],
        ['right' as Placement, '250px', '90px'],
        ['top' as Placement, '185px', '60px'],
    ])('positions the overlay against the target for %s placement', (placement, left, top) => {
        render(<Harness placement={placement} />);

        // Overlay is laid out on the requested side of the target, centered on the other axis
        expect(overlayPosition()).toEqual({ left, placement, top });
    });

    // Same geometry as above, shifted by the scroll offset. Absolutely positioned overlays are placed in document
    // coordinates, so every placement has to pick up scrollX/scrollY on both axes.
    test.each([
        ['bottom' as Placement, '485px', '520px', '185px', '120px'],
        ['left' as Placement, '420px', '490px', '120px', '90px'],
        ['right' as Placement, '550px', '490px', '250px', '90px'],
        ['top' as Placement, '485px', '460px', '185px', '60px'],
    ])(
        'adds the scroll offset on both axes for %s placement unless the overlay is fixed',
        (placement, scrolledLeft, scrolledTop, fixedLeft, fixedTop) => {
            setWindowMetrics({ scrollX: 300, scrollY: 400 });
            const { unmount } = render(<Harness placement={placement} />);

            // Document-positioned overlay is offset by the page scroll on both axes
            expect(overlayPosition()).toEqual({ left: scrolledLeft, placement, top: scrolledTop });

            unmount();
            render(<Harness isFixedPosition placement={placement} />);

            // Fixed overlay stays in viewport coordinates, ignoring the same scroll offset
            expect(overlayPosition()).toEqual({ left: fixedLeft, placement, top: fixedTop });
        }
    );

    // isFlexPlacement flips to whichever side of the target has more room, and both axes must follow the flipped
    // placement rather than the requested one.
    test.each([
        ['right' as Placement, 'left', { innerWidth: 400 }, '120px', '90px'],
        ['left' as Placement, 'right', { innerWidth: 1024 }, '250px', '90px'],
        ['bottom' as Placement, 'top', { innerHeight: 150 }, '185px', '60px'],
        ['top' as Placement, 'bottom', { innerHeight: 800 }, '185px', '120px'],
    ])('flips %s placement to %s when there is more room there', (placement, flipped, metrics, left, top) => {
        setWindowMetrics(metrics);
        render(<Harness isFlexPlacement placement={placement} />);

        // Reported placement flips and the overlay is laid out on the flipped side, not the requested one
        expect(overlayPosition()).toEqual({ left, placement: flipped, top });
    });

    test('clamps the overlay to the viewport edge before applying the scroll offset (Issue 49792)', () => {
        // Target sits close enough to the left edge that a left-placed overlay would overflow it
        targetBox = { ...TARGET_BOX, left: 10 };
        setWindowMetrics({ scrollX: 300 });

        render(<Harness placement="left" />);

        // Overlay is pinned to the viewport's left edge (document x of 300), not to document x of 0
        expect(overlayPosition()).toEqual({ left: '300px', placement: 'left', top: '90px' });
    });

    test('recomputes the position when isFixedPosition changes', () => {
        setWindowMetrics({ scrollX: 300, scrollY: 400 });
        const { rerender } = render(<Harness placement="bottom" />);

        expect(overlayPosition()).toEqual({ left: '485px', placement: 'bottom', top: '520px' });

        rerender(<Harness isFixedPosition placement="bottom" />);

        // Assert - scroll offset is dropped, so the effect re-ran rather than reusing the first computed style
        expect(overlayPosition()).toEqual({ left: '185px', placement: 'bottom', top: '120px' });
    });

    test('leaves the overlay off-screen when the target cannot be measured', () => {
        // Target ref is never attached, so the effect bails before computing a style
        render(<Harness attachTarget={false} placement="bottom" />);

        // Overlay keeps the off-screen default instead of rendering on top of the page at 0,0
        expect(overlayPosition()).toEqual({ left: '-10000px', placement: 'bottom', top: '-10000px' });
    });
});
