/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { RemoveEntityButton } from './RemoveEntityButton';

describe('RemoveEntityButton', () => {
    test('Default properties', async () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton onClick={onClick} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.container--removal-icon'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('Specify entity without index', () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton entity="Test" onClick={onClick} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        // verify "Remove Test" button is rendered
        expect(screen.getByText('Remove Test')).toBeInTheDocument();
    });

    test('Specify label class, index, and entity', () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton entity="Test" onClick={onClick} labelClass="test-label-class" index={3} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        // verify "Remove Test" button is rendered
        expect(screen.getByText('Remove Test 3')).toBeInTheDocument();

        // verify label class is applied
        expect(document.querySelectorAll('.test-label-class')).toHaveLength(1);
    });
});
