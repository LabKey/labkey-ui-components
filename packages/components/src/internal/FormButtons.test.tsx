/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { FormButtons } from './FormButtons';
import { ModalFooterSlotContext } from './ModalFooterSlot';

describe('FormButtons', () => {
    function renderButtons(): React.ReactElement {
        return (
            <FormButtons>
                <button className="test-cancel" type="button">
                    Cancel
                </button>
                <button className="test-submit" type="submit">
                    Submit
                </button>
            </FormButtons>
        );
    }

    test('renders inline and sticky by default', () => {
        const { container } = render(renderButtons());
        const buttons = container.querySelector('.form-buttons');
        expect(buttons).not.toBeNull();
        expect(buttons.classList.contains('form-buttons--sticky')).toBe(true);
        expect(buttons.querySelector('.form-buttons__left .test-cancel')).not.toBeNull();
        expect(buttons.querySelector('.form-buttons__right .test-submit')).not.toBeNull();
    });

    test('respects sticky={false}', () => {
        const { container } = render(
            <FormButtons sticky={false}>
                <button type="submit">Submit</button>
            </FormButtons>
        );
        const buttons = container.querySelector('.form-buttons');
        expect(buttons).not.toBeNull();
        expect(buttons.classList.contains('form-buttons--sticky')).toBe(false);
    });

    test('portals into the footer slot element and is never sticky there', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);

        const { container } = render(
            <ModalFooterSlotContext.Provider value={target}>{renderButtons()}</ModalFooterSlotContext.Provider>
        );

        expect(container.querySelector('.form-buttons')).toBeNull();
        const buttons = target.querySelector('.form-buttons');
        expect(buttons).not.toBeNull();
        expect(buttons.classList.contains('form-buttons--sticky')).toBe(false);
        expect(buttons.querySelector('.test-submit')).not.toBeNull();

        target.remove();
    });

    test('renders nothing while the slot element has not mounted (null)', () => {
        const { container } = render(
            <ModalFooterSlotContext.Provider value={null}>{renderButtons()}</ModalFooterSlotContext.Provider>
        );
        expect(container.querySelector('.form-buttons')).toBeNull();
        expect(document.querySelector('.form-buttons')).toBeNull();
    });
});
