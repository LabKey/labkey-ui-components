import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { WizardNavButtons } from './WizardNavButtons';

describe('<WizardNavButtons/>', () => {
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
