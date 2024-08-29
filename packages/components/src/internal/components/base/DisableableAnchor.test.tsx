import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DisableableAnchor } from './DisableableAnchor';

describe('DisableableAnchor', () => {
    test('renders enabled without styling', async () => {
        const expectedHref = 'http://test.url.com';
        const expectedText = 'Enabled Anchor';
        const onClickHandler = jest.fn();
        render(
            <DisableableAnchor href={expectedHref} onClick={onClickHandler}>
                {expectedText}
            </DisableableAnchor>
        );

        const anchor = document.querySelector('a');
        expect(anchor.innerHTML).toEqual(expectedText);
        expect(anchor.getAttribute('href')).toEqual(expectedHref);

        await userEvent.click(anchor);
        expect(onClickHandler).toHaveBeenCalled();
    });
    test('applies disabled', async () => {
        const expectedClassName = 'CS101';
        const expectedHref = 'http://test.url.com';
        const expectedText = 'Disabled Anchor';
        const onClickHandler = jest.fn();
        render(
            <DisableableAnchor
                className={expectedClassName}
                disabled
                href={expectedHref}
                onClick={onClickHandler}
                style={{ color: 'green' }}
            >
                {expectedText}
            </DisableableAnchor>
        );

        const anchor = document.querySelector('a');
        expect(anchor.getAttribute('class')).toEqual(`${expectedClassName} disabled`);
        expect(anchor.getAttribute('style')).toEqual('pointer-events: none; color: green;');
        expect(anchor.getAttribute('tabIndex')).toEqual('-1');
    });
});
