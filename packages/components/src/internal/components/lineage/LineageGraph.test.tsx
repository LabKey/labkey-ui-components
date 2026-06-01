/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { LineageDepthLimitMessage } from './LineageGraph';

describe('LineageDepthLimitMessage', () => {
    test('default properties', () => {
        render(<LineageDepthLimitMessage />);

        const message = screen.getByText('Note: Showing a maximum of 5 generations from the seed node.');
        expect(message).toHaveClass('lineage-graph-generation-limit-msg');
    });

    test('custom props, not root', () => {
        render(
            <LineageDepthLimitMessage
                className="my-class"
                maxDistance={10}
                nodeName="B-52"
            />
        );

        const message = screen.getByText('Note: Showing a maximum of 10 generations from B-52.');
        expect(message).toHaveClass('my-class');
    });

    test('is root', () => {
        render(<LineageDepthLimitMessage isRoot />);

        const message = screen.getByText('Note: Showing a maximum of 5 generations.');
        expect(message).toHaveClass('lineage-graph-generation-limit-msg');
    });
});
