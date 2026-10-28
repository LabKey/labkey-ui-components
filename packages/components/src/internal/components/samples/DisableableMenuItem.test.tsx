/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { DisableableMenuItem } from './DisableableMenuItem';
import { userEvent } from '@testing-library/user-event';

describe('DisableableMenuItem', () => {
    function validate(disabled: boolean, menuContent: string): void {
        const menuItem = document.querySelector('.lk-menu-item');
        expect(menuItem).not.toBeNull();
        const link = menuItem.querySelector('a');
        if (disabled) {
            expect(menuItem.getAttribute('class')).toContain('disabled');
            expect(link.getAttribute('aria-disabled')).toBe('true');
            expect(link.getAttribute('aria-description')).toBe(
                'The current status of the sample does not permit this operation.'
            );
        } else {
            expect(menuItem.getAttribute('class')).not.toContain('disabled');
            expect(link.hasAttribute('aria-disabled')).toBe(false);
            expect(link.hasAttribute('aria-description')).toBe(false);
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

    test('disabled, shows message on focus', async () => {
        render(
            <DisableableMenuItem disabled disabledMessage="Not allowed">
                Other test
            </DisableableMenuItem>
        );
        expect(document.querySelector('.disabled-menu-item-popover')).toBeNull();
        await userEvent.tab();
        expect(document.querySelector('.disabled-menu-item-popover').textContent).toBe('Not allowed');
        expect(document.querySelector('.lk-menu-item a').getAttribute('aria-description')).toBe('Not allowed');
        await userEvent.tab();
        expect(document.querySelector('.disabled-menu-item-popover')).toBeNull();
    });
});
