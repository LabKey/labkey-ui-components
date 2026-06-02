/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ProductNavigationItem } from './ProductNavigationItem';

const DEFAULT_PROPS = {
    id: 'test-id',
    onClick: jest.fn,
    url: 'http://go.here',
};

describe('ProductClickableItem', () => {
    function validate() {
        expect(document.querySelectorAll('.clickable-item')).toHaveLength(1);
    }

    test('with child comp', () => {
        render(
            <ProductNavigationItem {...DEFAULT_PROPS}>
                <div className="child-comp" />
            </ProductNavigationItem>
        );
        validate();
        expect(document.querySelectorAll('.child-comp')).toHaveLength(1);
    });

    test('hovered', async () => {
        render(<ProductNavigationItem {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('a').getAttribute('class')).not.toContain('labkey-page-nav');

        await userEvent.hover(document.querySelector('a'));
        expect(document.querySelector('a').getAttribute('class')).toContain('labkey-page-nav');

        await userEvent.unhover(document.querySelector('a'));
        expect(document.querySelector('a').getAttribute('class')).not.toContain('labkey-page-nav');
    });
});
