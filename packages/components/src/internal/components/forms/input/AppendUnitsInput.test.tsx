/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { Formsy } from '../formsy';

import { AppendUnitsInput } from './AppendUnitsInput';

describe('AppendUnitsInput', () => {
    const column = new QueryColumn({
        caption: 'Molecular Weight',
        fieldKey: 'appendUnitsColumn',
        name: 'appendUnitsColumn',
    });

    test('without formsy', () => {
        // Without Formsy it should not crash the page
        renderWithAppContext(<AppendUnitsInput col={column} data={undefined} value={undefined} />);
        expect(document.querySelector('input[name="appendUnitsColumn"]')).not.toBeInTheDocument();
    });

    test('with formsy', () => {
        renderWithAppContext(
            <Formsy>
                <AppendUnitsInput col={column} data={undefined} formsy value={undefined} />
            </Formsy>
        );
        expect(document.querySelector('input[name="appendUnitsColumn"]')).toBeInTheDocument();
    });
});
