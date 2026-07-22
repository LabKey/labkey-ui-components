/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useModalFooter } from '../../ModalFooterContext';

import { WizardNavButtons } from './WizardNavButtons';

jest.mock('../../ModalFooterContext', () => ({
    ...jest.requireActual('../../ModalFooterContext'),
    useModalFooter: jest.fn(),
}));

const mockUseModalFooter = useModalFooter as jest.MockedFunction<typeof useModalFooter>;

describe('WizardNavButtons', () => {
    beforeEach(() => {
        mockUseModalFooter.mockReturnValue(null);
    });
    test('default props', () => {
        render(<WizardNavButtons cancel={jest.fn()} />);
        expect(document.querySelectorAll('button')).toHaveLength(2);
        expect(document.querySelectorAll('button')[0]).toHaveTextContent('Cancel');
        expect(document.querySelectorAll('button')[1]).toHaveTextContent('Next');
        expect(document.querySelectorAll('button')[1]).not.toBeDisabled();
    });

    test('finish props', () => {
        render(
            <WizardNavButtons
                cancel={jest.fn()}
                canFinish={false}
                finish
                finishText="Custom Finish"
                nextStep={jest.fn()}
            />
        );
        expect(document.querySelectorAll('button')).toHaveLength(2);
        expect(document.querySelectorAll('button')[0]).toHaveTextContent('Cancel');
        expect(document.querySelectorAll('button')[1]).toHaveTextContent('Custom Finish');
        expect(document.querySelectorAll('button')[1]).toBeDisabled();
    });

    test('with children', () => {
        render(
            <WizardNavButtons cancel={jest.fn()}>
                <button className="test-btn-1" type="button">
                    My Additional Button
                </button>
            </WizardNavButtons>
        );
        expect(document.querySelectorAll('button')).toHaveLength(3);
        expect(document.querySelectorAll('button')[0]).toHaveTextContent('Cancel');
        expect(document.querySelectorAll('button')[1]).toHaveTextContent('My Additional Button');
    });

    test('formId applies the form attribute to the next button', () => {
        render(<WizardNavButtons cancel={jest.fn()} formId="my-form" />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1]).toHaveTextContent('Next');
        expect(buttons[1]).toHaveAttribute('form', 'my-form');
        expect(buttons[0]).not.toHaveAttribute('form');
    });

    test('formId applies the form attribute to the finish button', () => {
        render(<WizardNavButtons cancel={jest.fn()} finish formId="my-form" nextStep={jest.fn()} />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1]).toHaveTextContent('Finish');
        expect(buttons[1]).toHaveAttribute('form', 'my-form');
    });

    test('no form attribute when formId is omitted', () => {
        render(<WizardNavButtons cancel={jest.fn()} />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1]).not.toHaveAttribute('form');
    });

    test('onClick handlers', async () => {
        const cancelFn = jest.fn();
        const prevFn = jest.fn();
        const nextFn = jest.fn();
        render(<WizardNavButtons cancel={cancelFn} nextStep={nextFn} previousStep={prevFn} />);
        expect(cancelFn).toHaveBeenCalledTimes(0);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        await userEvent.click(document.querySelectorAll('button')[0]); // Cancel
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        await userEvent.click(document.querySelectorAll('button')[1]); // Back
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(0);

        await userEvent.click(document.querySelectorAll('button')[2]); // Next
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(1);
    });

    test('portals into the modal footer when one is provided', () => {
        const footer = document.createElement('div');
        footer.className = 'modal-footer modal-buttons';
        document.body.appendChild(footer);
        mockUseModalFooter.mockReturnValue(footer);

        render(<WizardNavButtons cancel={jest.fn()} />);

        expect(document.querySelector('.form-buttons--sticky')).toBeNull();
        expect(footer.querySelector('.form-buttons')).not.toBeNull();

        const buttons = footer.querySelectorAll('button');
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveTextContent('Cancel');
        expect(buttons[1]).toHaveTextContent('Next');

        document.body.removeChild(footer);
    });
});
