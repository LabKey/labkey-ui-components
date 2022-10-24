import React from 'react';

import { initUnitTestMocks } from '../test/testHelperMocks';
import { selectOptionByText, SELECT_INPUT_CONTROL_SELECTOR } from '../internal/components/forms/input/SelectInputTestUtils';
import { mountWithAppServerContext } from '../internal/testHelpers';
import { TEST_USER_EDITOR } from '../internal/userFixtures';

import { AssayTypeSummary } from './AssayTypeSummary';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<AssayTypeSummary />', () => {
    test('Assay Type Display', async () => {
        const component = mountWithAppServerContext(
            <AssayTypeSummary navigate={jest.fn()} />,
            {},
            { user: TEST_USER_EDITOR }
        );

        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);

        await selectOptionByText(component, 'Heatmap');

        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);

        component.unmount();
    });
});
