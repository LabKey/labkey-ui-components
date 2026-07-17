/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { WizardNavButtons } from './WizardNavButtons';

describe('WizardNavButtons', () => {
    test('default props', () => {
        render(<WizardNavButtons cancel={jest.fn()} />);
        expect(document.querySelectorAll('button').length === 2);
        expect(document.querySelectorAll('button')[0].textContent).toEqual('Cancel');
        expect(document.querySelectorAll('button')[1].textContent).toEqual('Next');
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toEqual(false);
    });

    test('finish props', () => {
        render(
            <WizardNavButtons
                cancel={jest.fn()}
                finishText="Custom Finish"
                finish
                nextStep={jest.fn()}
                canFinish={false}
            />
        );
        expect(document.querySelectorAll('button').length).toEqual(2);
        expect(document.querySelectorAll('button')[0].textContent).toEqual('Cancel');
        expect(document.querySelectorAll('button')[1].textContent).toEqual('Custom Finish');
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toEqual(true);
    });

    test('with children', () => {
        render(
            <WizardNavButtons cancel={jest.fn()}>
                <button className="test-btn-1" type="button">
                    My Additional Button
                </button>
            </WizardNavButtons>
        );
        expect(document.querySelectorAll('button').length).toEqual(3);
        expect(document.querySelectorAll('button')[0].textContent).toEqual('Cancel');
        expect(document.querySelectorAll('button')[1].textContent).toEqual('My Additional Button');
    });

    test('formId applies the form attribute to the next button', () => {
        render(<WizardNavButtons cancel={jest.fn()} formId="my-form" />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1].textContent).toEqual('Next');
        expect(buttons[1].getAttribute('form')).toEqual('my-form');
        expect(buttons[0].hasAttribute('form')).toBe(false);
    });

    test('formId applies the form attribute to the finish button', () => {
        render(<WizardNavButtons cancel={jest.fn()} finish formId="my-form" nextStep={jest.fn()} />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1].textContent).toEqual('Finish');
        expect(buttons[1].getAttribute('form')).toEqual('my-form');
    });

    test('no form attribute when formId is omitted', () => {
        render(<WizardNavButtons cancel={jest.fn()} />);
        const buttons = document.querySelectorAll('button');
        expect(buttons[1].hasAttribute('form')).toBe(false);
    });

    test('onClick handlers', async () => {
        const cancelFn = jest.fn();
        const prevFn = jest.fn();
        const nextFn = jest.fn();
        render(<WizardNavButtons cancel={cancelFn} previousStep={prevFn} nextStep={nextFn} />);
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
});
