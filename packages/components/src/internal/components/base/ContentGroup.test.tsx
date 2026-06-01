/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { ContentGroup, ContentGroupLabel } from './ContentGroup';

describe('ContentGroupLabel', () => {
    test('default props', () => {
        render(<ContentGroupLabel />);
        expect(document.querySelectorAll('.content-group-label')).toHaveLength(1);
        expect(document.querySelectorAll('.content-group')).toHaveLength(1);
    });

    test('withoutBottomMargin', () => {
        render(<ContentGroupLabel withoutBottomMargin />);
        expect(document.querySelectorAll('.content-group-label')).toHaveLength(1);
        expect(document.querySelectorAll('.content-group')).toHaveLength(0);
    });
});

describe('ContentGroup', () => {
    test('default props', () => {
        render(<ContentGroup />);
        expect(document.querySelectorAll('.content-group')).toHaveLength(1);
        expect(document.querySelectorAll('.content-group-label')).toHaveLength(0);
    });

    test('label', () => {
        render(<ContentGroup label={<div>testing</div>} />);
        expect(document.querySelectorAll('.content-group')).toHaveLength(2);
        expect(document.querySelectorAll('.content-group-label')).toHaveLength(1);
    });
});
