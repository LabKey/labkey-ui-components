/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION } from '../samples/models';

import { Formsy } from './formsy';
import { QueryInfoQuantity } from './QueryInfoQuantity';

describe('QueryInfoQuantity', () => {
    function validate(optionCount: number, includeCount: boolean): void {
        expect(document.querySelectorAll('.creation-type-radioinput')).toHaveLength(optionCount === 0 ? 0 : 1);
        expect(document.querySelectorAll('#numItems')).toHaveLength(includeCount || optionCount > 0 ? 1 : 0);
    }

    test('no content', () => {
        renderWithAppContext(
            <QueryInfoQuantity
                creationTypeOptions={undefined}
                includeCountField={false}
                maxCount={5}
                countText="Quantity"
            />
        );
        validate(0, false);
    });

    test('no options, show quantity', () => {
        renderWithAppContext(
            <Formsy>
                <QueryInfoQuantity creationTypeOptions={[]} includeCountField maxCount={5} countText="Quantity" />
            </Formsy>
        );
        validate(0, true);
        const input = document.querySelector('#numItems');
        expect(input).toHaveAttribute('max', '5');
        expect(input).toHaveValue(1);
    });

    test('multiple options, no default selection', () => {
        renderWithAppContext(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
                    includeCountField={false}
                    maxCount={5}
                    countText="Quantity"
                />
            </Formsy>
        );
        validate(2, false);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);
        expect(document.querySelector('.control-label')).toHaveTextContent('Quantity *');
    });

    test('multiple options, default selection', () => {
        renderWithAppContext(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[{ ...DERIVATIVE_CREATION, selected: true }, POOLED_SAMPLE_CREATION]}
                    includeCountField
                    maxCount={5}
                    countText="Quantity"
                />
            </Formsy>
        );
        validate(2, false);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);
        expect(document.querySelector('.control-label')).toHaveTextContent('Derivatives Per Parent *');
    });
});
