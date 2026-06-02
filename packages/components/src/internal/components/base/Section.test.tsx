/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { Section } from './Section';

describe('Section', () => {
    test('default properties', () => {
        render(<Section />);
        expect(document.querySelectorAll('.g-section')).toHaveLength(1);
        expect(document.querySelectorAll('.panel')).toHaveLength(1);
        expect(document.querySelectorAll('.panel-content-title-large')).toHaveLength(0);
        expect(document.querySelectorAll('.panel-content-caption')).toHaveLength(0);
        expect(document.querySelectorAll('.panel-content-context')).toHaveLength(0);
    });

    test('custom properties', () => {
        render(
            <Section
                caption={<p>Testing Caption</p>}
                context={<div>Testing Context</div>}
                title="Testing Title"
                panelClassName="testing-class-name"
            />
        );
        expect(document.querySelectorAll('.g-section')).toHaveLength(1);
        expect(document.querySelectorAll('.panel')).toHaveLength(1);
        expect(document.querySelectorAll('.testing-class-name')).toHaveLength(1);
        expect(screen.getByText('Testing Title')).toBeInTheDocument();
        expect(screen.getByText('Testing Caption')).toBeInTheDocument();
        expect(screen.getByText('Testing Context')).toBeInTheDocument();
    });
});
