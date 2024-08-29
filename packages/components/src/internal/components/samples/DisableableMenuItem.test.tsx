import React from 'react';

import { render } from '@testing-library/react';

import { DisableableMenuItem } from './DisableableMenuItem';
import userEvent from '@testing-library/user-event';

describe('DisableableMenuItem', () => {
    function validate(disabled: boolean, menuContent: string): void {
        const menuItem = document.querySelector('.lk-menu-item');
        expect(menuItem).not.toBeNull();
        if (disabled) {
            expect(menuItem.getAttribute('class')).toContain('disabled');
        } else {
            expect(menuItem.getAttribute('class')).not.toContain('disabled');
        }

        expect(menuItem.textContent).toBe(menuContent);
    }

    test('operation permitted', (): void => {
        const content = 'Test Operation';
        render(<DisableableMenuItem disabled={false}>{content}</DisableableMenuItem>);
        validate(false, content);
    });

    test('operation permitted, menu props', async () => {
        const onClick = jest.fn();
        render(
            <DisableableMenuItem disabled={false} onClick={onClick}>
                <span>Test Operation</span>
            </DisableableMenuItem>
        );
        validate(false, 'Test Operation');
        await userEvent.click(document.querySelector('.lk-menu-item a'));
        expect(onClick).toHaveBeenCalled();
    });

    test('disabled', (): void => {
        render(
            <DisableableMenuItem disabled={true} onClick={jest.fn()}>
                <div>Other test</div>
            </DisableableMenuItem>
        );
        validate(true, 'Other test');
    });

    test('disabled, alternate overlay placement', async () => {
        const content = 'Other test';
        const onClick = jest.fn();
        render(
            <DisableableMenuItem onClick={onClick} disabled={true} placement="right">
                {content}
            </DisableableMenuItem>
        );
        validate(true, content);
        await userEvent.click(document.querySelector('.lk-menu-item a'));
        expect(onClick).not.toHaveBeenCalled();
    });
});
