/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { DomainRowWarning } from './DomainRowWarning';
import { DomainFieldError } from './models';

describe('DomainRowWarning', () => {
    test('without extra info', () => {
        render(
            <DomainRowWarning fieldError={new DomainFieldError({ message: 'Test Warning', severity: 'Warning' })} />
        );
        expect(document.querySelector('.domain-row-warning').textContent).toBe('Warning: Test Warning');
    });

    test('with extra info', () => {
        render(
            <DomainRowWarning
                fieldError={
                    new DomainFieldError({ message: 'Test Warning', severity: 'Warning', extraInfo: 'Test Extra' })
                }
            />
        );
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(1);
    });
});
