/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { Alert } from './Alert';

describe('Alert', () => {
    test('with children', () => {
        render(<Alert>My alert message</Alert>);

        // verify the alert message
        expect(screen.getByText('My alert message')).toBeInTheDocument();
    });

    test('without children', () => {
        const { container } = render(<Alert />);

        // verify the document body is empty
        expect(container.firstChild).toBeNull();
    });

    test('bsStyle prop', () => {
        render(<Alert bsStyle="warning">My alert message</Alert>);

        // verify bsStyle is warning
        expect(screen.getByRole('alert')).toHaveClass('alert-warning');
    });
});
