/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { LockIcon } from './LockIcon';

const DEFAULT_PROPS = {
    id: 'jest-lock-id',
    title: 'Jest Testing Lock',
    body: <div>Jest testing body</div>,
};

describe('LockIcon', () => {
    test('default properties', () => {
        render(<LockIcon {...DEFAULT_PROPS} />);
        expect(document.querySelectorAll('.domain-field-lock-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-lock')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-unlock')).toHaveLength(0);
    });

    test('custom properties', () => {
        render(<LockIcon {...DEFAULT_PROPS} iconCls="jest-testing-cls" />);
        expect(document.querySelectorAll('.domain-field-lock-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.jest-testing-cls')).toHaveLength(1);
    });
});
