import React from 'react';

import { render } from '@testing-library/react';

import { ChoicesListItem } from './ChoicesListItem';

describe('ChoicesListItem', () => {
    const DEFAULT_PROPS = {
        index: 0,
        label: 'Available',
        active: false,
        onSelect: jest.fn,
    };

    function validate(active = false, hasComponentRight = false, itemType = 'Available', disabled?: boolean): void {
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(active ? 1 : 0);
        expect(document.querySelectorAll('.choices-list__sub-label')).toHaveLength(itemType !== 'Available' ? 1 : 0);
        expect(document.querySelectorAll('.component-right')).toHaveLength(hasComponentRight ? 1 : 0);
        expect(document.querySelector('button').textContent).toBe(itemType);
        if (disabled) expect(document.querySelector('button').hasAttribute('disabled')).toBeTruthy();
    }

    test('default props', () => {
        render(<ChoicesListItem {...DEFAULT_PROPS} />);
        validate();
    });

    test('active', () => {
        render(<ChoicesListItem {...DEFAULT_PROPS} active />);
        validate(true);
    });

    test('subLabel', () => {
        render(<ChoicesListItem {...DEFAULT_PROPS} subLabel="Received" />);
        validate(false, false, 'AvailableReceived');
    });

    test('component right', () => {
        render(
            <ChoicesListItem
                {...DEFAULT_PROPS}
                subLabel="Type"
                componentRight={<div className="component-right">TEST</div>}
            />
        );
        validate(false, true, 'AvailableTypeTEST');
    });

    test('disabled', () => {
        render(<ChoicesListItem {...DEFAULT_PROPS} disabled={true} />);
        validate(false, false, undefined, true);
    });
});
