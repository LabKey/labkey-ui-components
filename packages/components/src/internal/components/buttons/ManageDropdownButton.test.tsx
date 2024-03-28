import React from 'react';
import { render } from '@testing-library/react';

import { ManageDropdownButton } from './ManageDropdownButton';

describe('ManageDropdownButton', () => {
    test('default props', () => {
        const { container } = render(<ManageDropdownButton />);
        expect(container).toMatchSnapshot();
    });

    test('showIcon false', () => {
        const { container } = render(<ManageDropdownButton showIcon={false} />);
        expect(container).toMatchSnapshot();
    });

    test('disabled', () => {
        const { container } = render(<ManageDropdownButton disabled />);
        expect(container).toMatchSnapshot();
    });
});
