/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { DisableableButton } from './DisableableButton';

describe('DisableableButton', () => {
    test('No disabled message', () => {
        render(<DisableableButton bsStyle="primary" onClick={jest.fn()} />);

        expect(document.querySelector('button').hasAttribute('disabled')).toEqual(false);
    });

    test('With disabled message', () => {
        render(
            <DisableableButton
                bsStyle="primary"
                onClick={jest.fn()}
                disabledMsg="An informative message"
                title="the title"
            />
        );

        expect(document.querySelector('button').hasAttribute('disabled')).toEqual(true);
    });

    test('With styles', () => {
        render(<DisableableButton bsStyle="primary" onClick={jest.fn()} className="classname1" />);

        expect(document.querySelector('button').getAttribute('class')).toBe('classname1 btn btn-primary');
    });
});
