/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { SectionHeading } from './SectionHeading';

describe('<SectionHeading/>', () => {
    test('title only', () => {
        const component = <SectionHeading title="Section Heading Title" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('title and cls', () => {
        const component = <SectionHeading title="Section Heading Title" cls="section-heading-cls" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
