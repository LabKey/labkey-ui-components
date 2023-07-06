import React from 'react';
import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';

import { InsufficientPermissionsAlert } from './InsufficientPermissionsAlert';

describe('InsufficientPermissionsAlert', () => {
    test('default properties', () => {
        render(<InsufficientPermissionsAlert />);
        expect(screen.getByText('You do not have permissions for this action.')).toBeDefined();
    });

    test('custom message', () => {
        const message = 'My customized message.';
        render(<InsufficientPermissionsAlert message={message} />);
        expect(screen.getByText(message)).toBeDefined();
    });
});
