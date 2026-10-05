/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { DiscardConsumedSamplesPanel } from './DiscardConsumedSamplesPanel';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { AppContextTestProviderProps } from '../../test/testHelpers';

describe('DiscardConsumedSamplesPanel', () => {
    function defaultContext(): AppContextTestProviderProps {
        return { serverContext: { container: TEST_PROJECT_CONTAINER } };
    }

    function getTitle(): string {
        return document.getElementsByClassName('discard-consumed-title').item(0).textContent;
    }

    test('discard enabled', () => {
        renderWithAppContext(
            <DiscardConsumedSamplesPanel discardTitle="Remove All?" shouldDiscard toggleShouldDiscard={jest.fn()} />,
            defaultContext()
        );

        expect(getTitle()).toEqual(' Remove All?');
    });

    test('remove disabled', () => {
        renderWithAppContext(
            <DiscardConsumedSamplesPanel shouldDiscard={false} toggleShouldDiscard={jest.fn()} />,
            defaultContext()
        );

        expect(getTitle()).toEqual(' Remove Sample(s) from Storage?');
    });
});
