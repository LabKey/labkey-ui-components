/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { StandardAssayPanel } from './StandardAssayPanel';

describe('StandardAssayPanel', () => {
    test('without provider prop', async () => {
        render(<StandardAssayPanel />);

        // verify no supported file types
        expect(document.body).toHaveTextContent('Supported File Types');
        expect(document.body).not.toHaveTextContent('txt');
    });

    test('provider prop with fileTypes', async () => {
        render(<StandardAssayPanel provider={{ fileTypes: ['txt', 'xls', 'other'] }} />);

        // verify supported file types
        expect(document.body).toHaveTextContent('txt, xls, other');
    });

    test('with children', async () => {
        render(
            <StandardAssayPanel>
                <div>child</div>
            </StandardAssayPanel>
        );

        // verify child is rendered
        expect(document.body).toHaveTextContent('child');
    });
});
