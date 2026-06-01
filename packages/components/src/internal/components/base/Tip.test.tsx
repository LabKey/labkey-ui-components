/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { Tip } from './Tip';

describe('<Tip />', () => {
    test('Render children', () => {
        render(
            <Tip caption="nothing important">
                <div>Here's my tip for you</div>
            </Tip>
        );
        expect(document.querySelector('div').textContent).toBe("Here's my tip for you");
    });
});
