/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import React from 'react';
import { render } from '@testing-library/react';

import { DomainFieldsDisplay } from './DomainFieldsDisplay';
import { DomainDesign } from './models';

const testDomain = new DomainDesign({ name: 'test domain name' });

describe('DomainFieldsDisplay', () => {
    test('with empty domain design', () => {
        const domain = new DomainDesign();
        const { container} = render(<DomainFieldsDisplay domain={domain} />);

        expect(container).toMatchSnapshot();
    });

    test('without title', () => {
        const { container} = render(<DomainFieldsDisplay domain={testDomain} />);

        expect(container).toMatchSnapshot();
    });

    test('with title', () => {
        const { container} = render(<DomainFieldsDisplay domain={testDomain} title="test domain title" />);

        expect(container).toMatchSnapshot();
    });
});
